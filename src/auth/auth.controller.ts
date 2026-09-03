import type { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service.js';

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

    const user = await authService.registerUser({ name, email, password });

    return reply.status(201).send({
        id: user.id,
        name: user.name,
        email: user.email,
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

    const result = await authService.loginUser({ email, password });

    return reply.send(result);
}

// Função para renovar o access token
export async function refreshController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { refreshToken } = request.body as { refreshToken: string };

    const result = await authService.refreshAccessToken(refreshToken);

    return reply.send(result);
}

// Função para fazer logout
export async function logoutController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { refreshToken } = request.body as { refreshToken: string };

    await authService.logout(refreshToken);

    return reply.status(204).send();
}

// Função para buscar um usuário pelo ID
export async function getUserByIdController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { id } = request.params as { id: string };

    const user = await authService.getUserById(id);

    return reply.send(user);
}

// Função para atualizar os dados do usuário
export async function updateUserController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { id } = request.params as { id: string };
    const { name, email, password } = request.body as {
        name?: string;
        email?: string;
        password?: string;
    };

    const user = await authService.updateUser(id, { name, email, password });

    return reply.send(user);
}

// Função para deletar um usuário
export async function deleteUserController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { id } = request.params as { id: string };

    await authService.deleteUser(id);

    return reply.status(204).send();
}

export const userController = {
    registerController,
    loginController,
    refreshController,
    logoutController,
    getUserByIdController,
    updateUserController,
    deleteUserController,
};

