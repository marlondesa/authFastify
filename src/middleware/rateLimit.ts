import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { fastifyRateLimit } from '@fastify/rate-limit';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const rateLimitConfig = {
    global: {
        max: 100,
        timeWindow: '1 minute',
    },
    register: {
        max: 5,
        timeWindow: '1 minute',
    },
    verifyEmail: {
        max: 5,
        timeWindow: '1 minute',
    },
    resendVerification: {
        max: 3,
        timeWindow: '1 hour',
    },
    login: {
        max: 5,
        timeWindow: '1 minute',
    },
    refresh: {
        max: 20,
        timeWindow: '1 minute',
    },
    logout: {
        max: 20,
        timeWindow: '1 minute',
    },
    userRead: {
        max: 60,
        timeWindow: '1 minute',
    },
    userWrite: {
        max: 30,
        timeWindow: '1 minute',
    },
};

const progressiveLoginWindows = [
    1 * 60 * 1000,    // 1 minuto
    5 * 60 * 1000,    // 5 minutos
    15 * 60 * 1000,   // 15 minutos
    60 * 60 * 1000,   // 1 hora
];

let redisClient: Redis | null = null;
let redisAvailable = false;

function getRedisClient(): Redis | null {
    if (env.REDIS_URL && !redisClient) {
        redisClient = new Redis(env.REDIS_URL, {
            lazyConnect: true,
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
        });

        redisClient.on('connect', () => {
            redisAvailable = true;
        });

        redisClient.on('error', (err) => {
            if (redisAvailable) {
                logger.warn({ error: err.message }, 'Redis indisponível; fallback para rate limit em memória');
            }
            redisAvailable = false;
        });

        redisClient.on('end', () => {
            redisAvailable = false;
        });
    }
    return redisClient;
}

function isRedisReady(): boolean {
    const redis = getRedisClient();
    if (!redis) return false;
    return redisAvailable && redis.status === 'ready';
}

const attemptsStore = new Map<string, { count: number; blockedUntil: number }>();

function getKey(prefix: string, value: string) {
    return `${prefix}:${value.toLowerCase().trim()}`;
}

function cleanupExpiredEntries() {
    const now = Date.now();
    for (const [key, value] of attemptsStore.entries()) {
        if (value.blockedUntil < now && value.count === 0) {
            attemptsStore.delete(key);
        }
    }
}

function checkRateLimitInMemory(key: string, max: number, windows: number[]) {
    cleanupExpiredEntries();

    const now = Date.now();
    const record = attemptsStore.get(key) ?? { count: 0, blockedUntil: 0 };

    if (now < record.blockedUntil) {
        const waitSeconds = Math.ceil((record.blockedUntil - now) / 1000);
        return { allowed: false, retryAfterSeconds: waitSeconds };
    }

    record.count += 1;

    if (record.count > max) {
        const penaltyIndex = Math.min(record.count - max - 1, windows.length - 1);
        const penalty = windows[Math.max(0, penaltyIndex)];
        record.blockedUntil = now + penalty;
        attemptsStore.set(key, record);
        return { allowed: false, retryAfterSeconds: Math.ceil(penalty / 1000) };
    }

    attemptsStore.set(key, record);
    return { allowed: true, retryAfterSeconds: 0 };
}

async function checkRateLimitRedis(key: string, max: number, windows: number[]) {
    const redis = getRedisClient();
    if (!redis || !isRedisReady()) {
        return checkRateLimitInMemory(key, max, windows);
    }

    const now = Date.now();
    const multi = redis.multi();
    multi.get(`${key}:blockedUntil`);
    multi.incr(key);
    multi.pexpire(key, windows[windows.length - 1]);

    try {
        const results = await multi.exec();

        const blockedUntil = Number(results?.[0]?.[1] ?? 0);
        if (now < blockedUntil) {
            const waitSeconds = Math.ceil((blockedUntil - now) / 1000);
            return { allowed: false, retryAfterSeconds: waitSeconds };
        }

        const count = Number(results?.[1]?.[1] ?? 0);

        if (count > max) {
            const penaltyIndex = Math.min(count - max - 1, windows.length - 1);
            const penalty = windows[Math.max(0, penaltyIndex)];
            const newBlockedUntil = now + penalty;
            await redis.psetex(`${key}:blockedUntil`, penalty, newBlockedUntil.toString());
            return { allowed: false, retryAfterSeconds: Math.ceil(penalty / 1000) };
        }

        return { allowed: true, retryAfterSeconds: 0 };
    } catch (error) {
        redisAvailable = false;
        logger.warn({ error: (error as Error).message }, 'Falha ao executar rate limit no Redis; usando fallback em memória');
        return checkRateLimitInMemory(key, max, windows);
    }
}

export async function checkLoginRateLimit(email: string) {
    return checkRateLimitRedis(getKey('login', email), rateLimitConfig.login.max, progressiveLoginWindows);
}

export async function checkRegisterRateLimit(email: string) {
    return checkRateLimitRedis(getKey('register', email), rateLimitConfig.register.max, progressiveLoginWindows);
}

export async function registerGlobalRateLimit(app: FastifyInstance) {
    const redis = getRedisClient();
    const globalConfig: Record<string, unknown> = { ...rateLimitConfig.global };

    if (redis) {
        globalConfig.redis = redis;
        app.log.info('Rate limit global configurado com Redis');
    } else {
        app.log.warn('REDIS_URL não configurada; rate limit global em memória (não escala horizontalmente)');
    }

    await app.register(fastifyRateLimit, globalConfig);
}

