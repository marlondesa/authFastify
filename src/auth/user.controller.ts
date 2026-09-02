import { FastifyRequest, FastifyReply } from 'fastify';
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

    const user = await authService.loginUser({ email, password });

    return reply.send(user);
}

// Função para buscar um usuário pelo ID
export async function getUserByIdController(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;

    const user = await authService.getUserById(id);

    return reply.send(user);
}

// Função para atualizar os dados do usuário
export async function updateUserController(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
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
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;

    await authService.deleteUser(id);

    return reply.status(204).send();
}

export const userController = {
    registerController,
    loginController,
    getUserByIdController,
    updateUserController,
    deleteUserController,
};

