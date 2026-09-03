import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
// Busca usuário ativo pelo email
export async function getUserByEmail(email) {
    return await prisma.user.findFirst({
        where: { email, deletedAt: null },
    });
}
// Busca usuário ativo pelo ID
export async function getUserById(id) {
    return await prisma.user.findFirst({
        where: { id, deletedAt: null },
    });
}
// Cria um novo usuário
export async function createUser(data) {
    return await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: data.password,
        },
    });
}
// Atualiza o usuário pelo ID
export async function updateUser(id, data) {
    return await prisma.user.update({
        where: { id },
        data,
    });
}
// Soft delete do usuário pelo ID
export async function softDeleteUser(id) {
    return await prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
}
// Cria um refresh token para o usuário
export async function createRefreshToken(data) {
    return await prisma.refreshToken.create({
        data: {
            token: data.token,
            userId: data.userId,
            expiresAt: data.expiresAt,
        },
    });
}
// Busca refresh token incluindo o usuário
export async function findRefreshToken(token) {
    return await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
    });
}
// Remove refresh token (logout)
export async function deleteRefreshToken(token) {
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
