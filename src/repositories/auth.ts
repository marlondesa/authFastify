import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

// Busca usuário ativo pelo email
export async function getUserByEmail(email: string) {
    return await prisma.user.findFirst({
        where: { email, deletedAt: null },
    });
}


// Busca usuário ativo pelo ID
export async function getUserById(id: string) {
    return await prisma.user.findFirst({
        where: { id, deletedAt: null },
    });
}

// Cria um novo usuário
export async function createUser(data: {
    name: string;
    email: string;
    password: string;
}) {
    return await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: data.password,
        },
    });
}

// Atualiza o usuário pelo ID
export async function updateUser(
    id: string,
    data: {
        name?: string;
        email?: string;
        password?: string;
    }
) {
    return await prisma.user.update({
        where: { id },
        data,
    });
}

// Soft delete do usuário pelo ID
export async function softDeleteUser(id: string) {
    return await prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
}

// Cria um refresh token para o usuário
export async function createRefreshToken(data: {
    token: string;
    userId: string;
    expiresAt: Date;
}) {
    return await prisma.refreshToken.create({
        data: {
            token: data.token,
            userId: data.userId,
            expiresAt: data.expiresAt,
        },
    });
}

// Busca refresh token incluindo o usuário
export async function findRefreshToken(token: string) {
    return await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
    });
}

// Remove refresh token (logout)
export async function deleteRefreshToken(token: string) {
    return await prisma.refreshToken.deleteMany({
        where: { token },
    });
}

export const authRepository = {
    getUserByEmail,
    getUserById,
    createUser,
    updateUser,
    softDeleteUser,
    createRefreshToken,
    findRefreshToken,
    deleteRefreshToken,
};