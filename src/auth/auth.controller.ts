import type { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service.js';
import { ForbiddenError, TooManyRequestsError } from '../errors/AppError.js';
import { checkLoginRateLimit, checkRegisterRateLimit } from '../middleware/rateLimit.js';
import { env } from '../config/env.js';

function ensureOwner(request: FastifyRequest, userId: string) {
    if (request.user.id !== userId) {
        throw new ForbiddenError('Você só pode acessar seus próprios dados');
    }
}

// Função para registrar um novo usuário
export async function registerController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { name, email, password } = request.body as {
        name: string;
        email: string;
        password: string;
    };

    const rateCheck = await checkRegisterRateLimit(email);

    if (!rateCheck.allowed) {
        throw new TooManyRequestsError(rateCheck.retryAfterSeconds);
    }

    const user = await authService.registerUser({ name, email, password });

    return reply.status(201).send({
        id: user.id,
        name: user.name,
        email: user.email,
        message: 'Conta criada. Verifique seu email para ativar.',
    });
}

// Função para autenticar um usuário existente
export async function loginController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { email, password } = request.body as {
        email: string;
        password: string;
    };

    const rateCheck = await checkLoginRateLimit(email);

    if (!rateCheck.allowed) {
        throw new TooManyRequestsError(rateCheck.retryAfterSeconds);
    }

    const result = await authService.loginUser({ email, password });

    reply.setCookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return reply.send({
        user: result.user,
        accessToken: result.accessToken,
    });
}

// Função para renovar o access token
export async function refreshController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
        return reply.status(401).send({ message: 'Refresh token não fornecido' });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    reply.setCookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return reply.send({ accessToken: result.accessToken });
}

// Função para fazer logout
export async function logoutController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const refreshToken = request.cookies.refreshToken;

    if (refreshToken) {
        await authService.logout(refreshToken);
    }

    reply.clearCookie('refreshToken', { path: '/api/refresh' });

    return reply.status(204).send();
}

// Função para verificar email
export async function verifyEmailController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { token } = request.body as { token: string };

    const result = await authService.verifyEmail(token);

    return reply.send(result);
}

// Função para reenviar verificação de email
export async function resendVerificationController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { email } = request.body as { email: string };

    const result = await authService.resendEmailVerification(email);

    return reply.send(result);
}

// Função para solicitar recuperação de senha
export async function forgotPasswordController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { email } = request.body as { email: string };

    const result = await authService.forgotPassword(email);

    return reply.send(result);
}

// Função para redefinir senha com token
export async function resetPasswordController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { token, password } = request.body as { token: string; password: string };

    const result = await authService.resetPassword(token, password);

    return reply.send(result);
}

// Função para buscar o usuário logado
export async function meController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const user = await authService.getUserById(request.user.id);

    return reply.send(user);
}

// Função para listar sessões ativas
export async function listSessionsController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const sessions = await authService.listUserSessions(request.user.id);

    return reply.send({ sessions });
}

// Função para revogar todas as sessões
export async function revokeAllSessionsController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    await authService.revokeAllSessions(request.user.id);

    reply.clearCookie('refreshToken', { path: '/api/refresh' });

    return reply.status(204).send();
}

// Função para buscar um usuário pelo ID
export async function getUserByIdController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { id } = request.params as { id: string };

    ensureOwner(request, id);

    const user = await authService.getUserById(id);

    return reply.send(user);
}

// Função para atualizar os dados do usuário
export async function updateUserController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { id } = request.params as { id: string };
    const { name, email, password, currentPassword } = request.body as {
        name?: string;
        email?: string;
        password?: string;
        currentPassword?: string;
    };

    ensureOwner(request, id);

    const user = await authService.updateUser(id, { name, email, password, currentPassword });

    if (email || password) {
        reply.clearCookie('refreshToken', { path: '/api/refresh' });
    }

    return reply.send(user);
}

// Função para deletar um usuário
export async function deleteUserController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { id } = request.params as { id: string };

    ensureOwner(request, id);

    await authService.deleteUser(id);

    return reply.status(204).send();
}

export const userController = {
    registerController,
    verifyEmailController,
    resendVerificationController,
    forgotPasswordController,
    resetPasswordController,
    loginController,
    refreshController,
    logoutController,
    meController,
    listSessionsController,
    revokeAllSessionsController,
    getUserByIdController,
    updateUserController,
    deleteUserController,
};

