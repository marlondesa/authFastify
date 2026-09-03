import { authRepository } from '../repositories/auth.js';
import argon2 from 'argon2';
import { randomBytes } from 'crypto';
import type { FastifyInstance } from 'fastify';

// Instância do Fastify injetada para acessar os métodos do JWT
let appInstance: FastifyInstance;

export function setFastifyInstance(app: FastifyInstance) {
    appInstance = app;
}

// Função para registrar um novo usuário
export async function registerUser(data: {
    name: string;
    email: string;
    password: string;
}) {
    const existingUser = await authRepository.getUserByEmail(data.email);

    if (existingUser) {
        throw new Error('Usuario já existe');
    }

    // Criptografar a senha do usuário antes de salvar no banco de dados
    const hashedPassword = await argon2.hash(data.password);

    const newUser = await authRepository.createUser({
        name: data.name,
        email: data.email,
        password: hashedPassword,
    });

    return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
    };
}

// Função para autenticar um usuário existente
export async function loginUser(data: {
    email: string;
    password: string;
}) {
    const user = await authRepository.getUserByEmail(data.email);

    if (!user) {
        throw new Error('Usuario não encontrado');
    }

    // Verificar se a senha está correta
    const isPasswordValid = await argon2.verify(user.password, data.password);

    if (!isPasswordValid) {
        throw new Error('Senha incorreta');
    }

    if (!appInstance) {
        throw new Error('Fastify instance não configurada para gerar JWT');
    }

    // Gerar access token JWT com os dados do usuário
    const accessToken = appInstance.jwt.sign(
        {
            id: user.id,
            email: user.email,
        },
        {
            expiresIn: '15m',
        }
    );

    // Gerar refresh token para renovação do access token
    const refreshToken = randomBytes(64).toString('hex');
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);

    await authRepository.createRefreshToken({
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiresAt,
    });

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        },
        accessToken,
        refreshToken,
    };
}

// Função para renovar o access token usando refresh token
export async function refreshAccessToken(refreshToken: string) {
    const storedToken = await authRepository.findRefreshToken(refreshToken);

    if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error('Refresh token inválido ou expirado');
    }

    if (!appInstance) {
        throw new Error('Fastify instance não configurada para gerar JWT');
    }

    const accessToken = appInstance.jwt.sign(
        {
            id: storedToken.user.id,
            email: storedToken.user.email,
        },
        {
            expiresIn: '15m',
        }
    );

    return { accessToken };
}

// Função para invalidar o refresh token (logout)
export async function logout(refreshToken: string) {
    await authRepository.deleteRefreshToken(refreshToken);
}

// Função para atualizar os dados do usuário
export async function updateUser(
    id: string,
    data: {
        name?: string;
        email?: string;
        password?: string;
    }
) {
    const existingUser = await authRepository.getUserById(id);

    if (!existingUser) {
        throw new Error('Usuário não encontrado');
    }

    if (data.email && data.email !== existingUser.email) {
        const emailInUse = await authRepository.getUserByEmail(data.email);
        if (emailInUse) {
            throw new Error('Email já está em uso');
        }
    }

    const updateData = { ...data };

    if (data.password) {
        updateData.password = await argon2.hash(data.password);
    }

    return authRepository.updateUser(id, updateData);
}

// Função para deletar um usuário (soft delete)
export async function deleteUser(id: string) {
    const existingUser = await authRepository.getUserById(id);

    if (!existingUser) {
        throw new Error('Usuário não encontrado');
    }

    return authRepository.softDeleteUser(id);
}

// Função para buscar um usuário pelo ID
export async function getUserById(id: string) {
    const user = await authRepository.getUserById(id);

    if (!user) {
        throw new Error('Usuário não encontrado');
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
    };
}

export const authService = {
    registerUser,
    loginUser,
    refreshAccessToken,
    logout,
    updateUser,
    deleteUser,
    getUserById,
    setFastifyInstance,
};