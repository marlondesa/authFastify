import jwt from 'jsonwebtoken';
import { env } from './env.js';

const JWT_SECRET = env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 7;

export function generateAccessToken(payload: { id: string; email: string }) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
    });
}

export function getRefreshTokenExpiresAt(): Date {
    const date = new Date();
    date.setDate(date.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);
    return date;
}
