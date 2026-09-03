import { z } from 'zod';

const urlSchema = z.string().refine(
    (value) => {
        try {
            // eslint-disable-next-line no-new
            new URL(value);
            return true;
        } catch {
            return false;
        }
    },
    { message: 'Deve ser uma URL válida' }
);

const baseEnvSchema = z.object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
    COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET deve ter pelo menos 32 caracteres'),
    PORT: z.coerce.number().default(3333),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    JWT_ISSUER: z.string().default('fastfy-api'),
    JWT_AUDIENCE: z.string().default('fastfy-web'),
    ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY é obrigatória').optional(),
    EMAIL_FROM: z.string().email().default('onboarding@resend.dev'),
    REDIS_URL: z.string().optional(),
    FRONTEND_URL: urlSchema.default('http://localhost:3000'),
});

const envSchema = baseEnvSchema
    .refine(
        (data) => {
            if (data.NODE_ENV === 'production' && !data.RESEND_API_KEY) {
                return false;
            }
            return true;
        },
        {
            message: 'RESEND_API_KEY é obrigatória em produção',
            path: ['RESEND_API_KEY'],
        }
    )
    .transform((data) => {
        const origins = data.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
        const invalidOrigins = origins.filter((o) => {
            if (o === '*') return false;
            try {
                // eslint-disable-next-line no-new
                new URL(o);
                return false;
            } catch {
                return true;
            }
        });
        return { ...data, parsedOrigins: origins, invalidOrigins };
    })
    .refine(
        (data: { invalidOrigins: string[] }) => data.invalidOrigins.length === 0,
        {
            message: 'ALLOWED_ORIGINS contém URLs inválidas',
            path: ['ALLOWED_ORIGINS'],
        }
    )
    .refine(
        (data) => !data.parsedOrigins.includes('*'),
        {
            message: 'ALLOWED_ORIGINS não pode conter "*" quando credentials estiver habilitado',
            path: ['ALLOWED_ORIGINS'],
        }
    )
    .transform((data) => {
        const { invalidOrigins, parsedOrigins, ...rest } = data;
        return { ...rest, ALLOWED_ORIGINS_LIST: parsedOrigins };
    });

export const env = envSchema.parse(process.env);
