import { Resend } from 'resend';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendVerificationEmail(
    to: string,
    token: string,
    baseUrl = env.FRONTEND_URL
) {
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

    if (!resend) {
        logger.warn({ email: to }, 'RESEND_API_KEY não configurada; email não enviado');
        return { sent: false, provider: 'resend', verifyUrl };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: env.EMAIL_FROM,
            to,
            subject: 'Verifique seu email - Fastfy',
            html: `
                <p>Olá,</p>
                <p>Clique no link abaixo para verificar seu email:</p>
                <a href="${verifyUrl}">${verifyUrl}</a>
                <p>Se não foi você, ignore este email.</p>
            `,
        });

        if (error) {
            logger.error({ error, email: to }, 'Falha ao enviar email de verificação');
            throw error;
        }

        logger.info({ email: to, messageId: data?.id }, 'Email de verificação enviado');
        return { sent: true, provider: 'resend', messageId: data?.id };
    } catch (error) {
        logger.error({ error, email: to }, 'Exceção ao enviar email de verificação');
        throw error;
    }
}

export async function sendPasswordResetEmail(
    to: string,
    token: string,
    baseUrl = env.FRONTEND_URL
) {
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    if (!resend) {
        logger.warn({ email: to }, 'RESEND_API_KEY não configurada; email de reset não enviado');
        return { sent: false, provider: 'resend', resetUrl };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: env.EMAIL_FROM,
            to,
            subject: 'Recuperação de senha - Fastfy',
            html: `
                <p>Olá,</p>
                <p>Recebemos uma solicitação para redefinir sua senha.</p>
                <p>Clique no link abaixo para criar uma nova senha. Ele expira em 1 hora:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>Se não foi você, ignore este email.</p>
            `,
        });

        if (error) {
            logger.error({ error, email: to }, 'Falha ao enviar email de recuperação de senha');
            throw error;
        }

        logger.info({ email: to, messageId: data?.id }, 'Email de recuperação de senha enviado');
        return { sent: true, provider: 'resend', messageId: data?.id };
    } catch (error) {
        logger.error({ error, email: to }, 'Exceção ao enviar email de recuperação de senha');
        throw error;
    }
}
