import 'dotenv/config';
import { fastify, type FastifyRequest, type FastifyReply } from 'fastify';
import { fastifyCors } from '@fastify/cors';
import { fastifyJwt } from '@fastify/jwt';
import { fastifyCookie } from '@fastify/cookie';
import { fastifyHelmet } from '@fastify/helmet';
import { fastifySwagger } from '@fastify/swagger';
import { validatorCompiler, serializerCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { authRoutes } from './auth/auth.routes.js';
import { AppError } from './errors/AppError.js';
import { registerGlobalRateLimit } from './middleware/rateLimit.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { startExpiredTokensCleanup } from './utils/cleanup.js';

const app = fastify({
    logger: {
        level: env.LOG_LEVEL,
        redact: {
            paths: ['req.body.password', 'req.body.currentPassword', 'req.body.confirmPassword', 'req.headers.authorization', 'req.headers.cookie'],
            censor: '[REDACTED]',
        },
    },
}).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyCors, {
    origin: env.ALLOWED_ORIGINS_LIST,
    credentials: true,
});

// Helmet para cabeçalhos de segurança HTTP
app.register(fastifyHelmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
});

// Cookies httpOnly
app.register(fastifyCookie, {
    secret: env.COOKIE_SECRET,
    parseOptions: {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    },
});

// Rate limiting global para toda a API
await registerGlobalRateLimit(app);

// Configuração do JWT para verificação de tokens
app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    decode: { complete: false },
    sign: {
        iss: env.JWT_ISSUER,
        aud: env.JWT_AUDIENCE,
    },
    verify: {
        allowedIss: env.JWT_ISSUER,
        allowedAud: env.JWT_AUDIENCE,
    },
});

// Tipa o payload do JWT no request
declare module '@fastify/jwt' {
    interface FastifyJWT {
        user: {
            id: string;
            email: string;
        };
    }
}

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.status(401).send({ message: 'Não autorizado' });
    }
});

// Tratamento global de erros
app.setErrorHandler((error: Error & { validation?: unknown }, _request, reply) => {
    if (error instanceof AppError) {
        const payload: Record<string, unknown> = { message: error.message };
        if ('retryAfterSeconds' in error) {
            payload.retryAfterSeconds = error.retryAfterSeconds;
        }
        logger.warn({ statusCode: error.statusCode, message: error.message }, 'AppError tratado');
        return reply.status(error.statusCode).send(payload);
    }

    if (error.validation) {
        logger.warn({ validation: error.validation }, 'Erro de validação');
        return reply.status(400).send({ message: 'Dados inválidos' });
    }

    logger.error(error, 'Erro interno não tratado');
    return reply.status(500).send({ message: 'Erro interno do servidor' });
});

// Registrar as rotas de autenticação
app.register(authRoutes, { prefix: '/api' });

// Configuração do Swagger/OpenAPI apenas em desenvolvimento
if (env.NODE_ENV === 'development') {
    app.register(fastifySwagger, {
        openapi: {
            info: {
                title: 'Fastfy API',
                version: '1.0.0',
            },
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
        },
        transform: jsonSchemaTransform,
    });
}


import { prisma } from './lib/prisma.js';

// Health check com verificação de conectividade real do banco
app.get('/health', async (_request, reply) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return reply.status(200).send({ status: 'ok', database: 'connected' });
    } catch (error) {
        logger.error(error, 'Health check falhou');
        return reply.status(503).send({ status: 'error', database: 'disconnected' });
    }
});



// Iniciar o servidor na porta definida em PORT ou 3333
const port = env.PORT;

const cleanupInterval = startExpiredTokensCleanup();

app.listen({
    port,
}).then(() => {
    logger.info(`HTTP server running on port ${port}!`);
});

function gracefulShutdown(signal: string) {
    return async () => {
        logger.info(`Received ${signal}. Closing server...`);
        clearInterval(cleanupInterval);
        const shutdownPromise = app.close();
        const timeout = setTimeout(() => {
            logger.error('Graceful shutdown timeout. Forcing exit.');
            process.exit(1);
        }, 10000);

        try {
            await shutdownPromise;
            await prisma.$disconnect();
            clearTimeout(timeout);
            process.exit(0);
        } catch (err) {
            clearTimeout(timeout);
            logger.error(err, 'Erro durante graceful shutdown');
            process.exit(1);
        }
    };
}

process.on('SIGTERM', gracefulShutdown('SIGTERM'));
process.on('SIGINT', gracefulShutdown('SIGINT'));

export default app;
