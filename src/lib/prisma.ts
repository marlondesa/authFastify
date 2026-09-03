import { env } from '../config/env.js';
import { PrismaClient } from '@prisma/client';

const logLevel = env.NODE_ENV === 'production'
    ? ['error' as const]
    : ['query' as const, 'error' as const, 'warn' as const];

export const prisma = new PrismaClient({
    log: logLevel,
    errorFormat: env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
});

// Garante desconexão limpa em graceful shutdown
export async function disconnectPrisma(): Promise<void> {
    await prisma.$disconnect();
}
