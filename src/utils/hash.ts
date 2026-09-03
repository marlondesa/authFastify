import argon2 from 'argon2';
import crypto from 'crypto';

export async function hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
        hashLength: 32,
    });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
        return await argon2.verify(hash, password);
    } catch {
        return false;
    }
}

export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export async function hashRefreshTokenFamily(tokenFamily: string): Promise<string> {
    return argon2.hash(tokenFamily, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
        hashLength: 32,
    });
}

export async function verifyRefreshTokenFamily(tokenFamily: string, hash: string): Promise<boolean> {
    try {
        return await argon2.verify(hash, tokenFamily);
    } catch {
        return false;
    }
}
