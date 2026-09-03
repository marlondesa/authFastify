import { prisma } from '../lib/prisma.js';
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
            emailVerifyToken: data.emailVerifyToken,
            emailVerifyTokenExpiresAt: data.emailVerifyTokenExpiresAt,
        },
    });
}
// Busca usuário ativo pelo token de verificação de email
export async function getUserByEmailVerifyToken(token) {
    return await prisma.user.findFirst({
        where: {
            emailVerifyToken: token,
            deletedAt: null,
        },
    });
}
// Marca email como verificado
export async function verifyUserEmail(id) {
    return await prisma.user.update({
        where: { id },
        data: {
            isEmailVerified: true,
            emailVerifyToken: null,
            emailVerifyTokenExpiresAt: null,
        },
    });
}
// Define novo token de verificação de email
export async function setEmailVerifyToken(id, token, expiresAt) {
    return await prisma.user.update({
        where: { id },
        data: {
            emailVerifyToken: token,
            emailVerifyTokenExpiresAt: expiresAt,
        },
    });
}
// Define token de recuperação de senha
export async function setPasswordResetToken(id, token, expiresAt) {
    return await prisma.user.update({
        where: { id },
        data: {
            passwordResetToken: token,
            passwordResetExpiresAt: expiresAt,
        },
    });
}
// Busca usuário ativo pelo token de recuperação de senha
export async function getUserByPasswordResetToken(token) {
    return await prisma.user.findFirst({
        where: {
            passwordResetToken: token,
            deletedAt: null,
        },
    });
}
// Atualiza a senha e limpa o token de recuperação
export async function resetPassword(id, hashedPassword) {
    return await prisma.user.update({
        where: { id },
        data: {
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpiresAt: null,
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
    const timestamp = new Date();
    return await prisma.user.update({
        where: { id },
        data: {
            deletedAt: timestamp,
            email: `${id}@deleted.local`,
            emailVerifyToken: null,
            emailVerifyTokenExpiresAt: null,
            passwordResetToken: null,
            passwordResetExpiresAt: null,
        },
    });
}
// Cria um refresh token para o usuário
export async function createRefreshToken(data) {
    return await prisma.refreshToken.create({
        data: {
            tokenHash: data.tokenHash,
            tokenFamily: data.tokenFamily,
            userId: data.userId,
            expiresAt: data.expiresAt,
        },
    });
}
// Busca refresh token não expirado pelo hash incluindo o usuário
export async function findRefreshToken(tokenHash) {
    return await prisma.refreshToken.findFirst({
        where: {
            tokenHash,
            expiresAt: { gt: new Date() },
        },
        include: { user: true },
    });
}
// Busca tokens de mesma family de um usuário para detectar roubo
export async function findRefreshTokensByFamily(userId, tokenFamily) {
    return await prisma.refreshToken.findMany({
        where: { userId, tokenFamily },
        orderBy: { createdAt: 'desc' },
    });
}
// Roda a rotação atômica de refresh token: deleta o antigo e cria o novo
export async function rotateRefreshToken(data) {
    return await prisma.$transaction(async (tx) => {
        await tx.refreshToken.deleteMany({
            where: { tokenHash: data.oldTokenHash },
        });
        return await tx.refreshToken.create({
            data: {
                tokenHash: data.newTokenHash,
                tokenFamily: data.tokenFamily,
                userId: data.userId,
                expiresAt: data.expiresAt,
            },
        });
    });
}
// Remove refresh token (logout)
export async function deleteRefreshToken(tokenHash) {
    return await prisma.refreshToken.deleteMany({
        where: { tokenHash },
    });
}
// Remove todos os refresh tokens de um usuário
export async function deleteAllUserRefreshTokens(userId) {
    return await prisma.refreshToken.deleteMany({
        where: { userId },
    });
}
// Remove todos os refresh tokens expirados
export async function deleteExpiredRefreshTokens() {
    return await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
    });
}
// Lista refresh tokens ativos de um usuário
export async function listUserRefreshTokens(userId) {
    return await prisma.refreshToken.findMany({
        where: {
            userId,
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            createdAt: true,
            expiresAt: true,
        },
    });
}
export const authRepository = {
    getUserByEmail,
    getUserById,
    createUser,
    getUserByEmailVerifyToken,
    verifyUserEmail,
    setEmailVerifyToken,
    setPasswordResetToken,
    getUserByPasswordResetToken,
    resetPassword,
    updateUser,
    softDeleteUser,
    createRefreshToken,
    findRefreshToken,
    findRefreshTokensByFamily,
    rotateRefreshToken,
    deleteRefreshToken,
    deleteAllUserRefreshTokens,
    deleteExpiredRefreshTokens,
    listUserRefreshTokens,
};
