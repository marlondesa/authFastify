import { authRepository } from '../repositories/auth.js';
import { randomBytes, createHash } from 'crypto';
import { nanoid } from 'nanoid';
import { generateAccessToken, getRefreshTokenExpiresAt } from '../config/jwt.js';
import { hashPassword, verifyPassword, hashToken } from '../utils/hash.js';
import { logger } from '../utils/logger.js';
import { sendVerificationEmail } from '../email/email.service.js';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../errors/AppError.js';

function sanitizeUser(user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
}

function normalizeUserInput(data: { name: string; email: string }) {
    return {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
    };
}

// Função para registrar um novo usuário
export async function registerUser(data: {
    name: string;
    email: string;
    password: string;
}) {
    const normalized = normalizeUserInput(data);

    const hashedPassword = await hashPassword(data.password);
    const emailVerifyToken = nanoid(32);
    const emailVerifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    try {
        const newUser = await authRepository.createUser({
            name: normalized.name,
            email: normalized.email,
            password: hashedPassword,
            emailVerifyToken,
            emailVerifyTokenExpiresAt,
        });

        logger.info({ userId: newUser.id }, 'Novo usuário registrado; verificação de email pendente');

        try {
            await sendVerificationEmail(normalized.email, emailVerifyToken);
        } catch {
            logger.error({ userId: newUser.id, email: normalized.email }, 'Falha no envio do email de verificação após registro');
        }

        return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
        };
    } catch (error: any) {
        if (error?.code === 'P2002') {
            throw new BadRequestError('Email já está em uso');
        }
        throw error;
    }
}

// Função para verificar email com token
export async function verifyEmail(token: string) {
    const user = await authRepository.getUserByEmailVerifyToken(token);

    if (!user || user.deletedAt) {
        throw new BadRequestError('Token de verificação inválido');
    }

    if (user.isEmailVerified) {
        return { message: 'Email verificado com sucesso' };
    }

    if (user.emailVerifyTokenExpiresAt && user.emailVerifyTokenExpiresAt < new Date()) {
        throw new BadRequestError('Token de verificação expirado');
    }

    await authRepository.verifyUserEmail(user.id);

    logger.info({ userId: user.id }, 'Email verificado com sucesso');

    return { message: 'Email verificado com sucesso' };
}

// Função para reenviar token de verificação
export async function resendEmailVerification(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await authRepository.getUserByEmail(normalizedEmail);

    if (!user || user.isEmailVerified || user.deletedAt) {
        // Retorna sucesso genérico para não enumerar emails
        return { message: 'Se o email existir e não estiver verificado, um novo token foi enviado' };
    }

    const emailVerifyToken = nanoid(32);
    const emailVerifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await authRepository.setEmailVerifyToken(user.id, emailVerifyToken, emailVerifyTokenExpiresAt);

    logger.info({ userId: user.id }, 'Token de verificação de email gerado');

    try {
        await sendVerificationEmail(normalizedEmail, emailVerifyToken);
    } catch {
        logger.error({ userId: user.id, email: normalizedEmail }, 'Falha no reenvio do email de verificação');
    }

    return { message: 'Se o email existir e não estiver verificado, um novo token foi enviado' };
}

// Função para autenticar um usuário existente
export async function loginUser(data: {
    email: string;
    password: string;
}) {
    const normalizedEmail = data.email.toLowerCase().trim();
    const user = await authRepository.getUserByEmail(normalizedEmail);

    if (!user) {
        logger.warn({ email: normalizedEmail }, 'Tentativa de login com email inexistente');
        throw new UnauthorizedError('Email ou senha inválidos');
    }

    const isPasswordValid = await verifyPassword(user.password, data.password);

    if (!isPasswordValid) {
        logger.warn({ userId: user.id }, 'Tentativa de login com senha incorreta');
        throw new UnauthorizedError('Email ou senha inválidos');
    }

    if (!user.isEmailVerified) {
        logger.warn({ userId: user.id }, 'Login bloqueado: email não verificado');
        throw new ForbiddenError('Email não verificado. Verifique sua caixa de entrada.');
    }

    const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
    });

    const refreshToken = randomBytes(64).toString('hex');
    const tokenFamily = createHash('sha256').update(randomBytes(32)).digest('hex');
    const refreshTokenHash = hashToken(refreshToken);
    const refreshTokenExpiresAt = getRefreshTokenExpiresAt();

    await authRepository.createRefreshToken({
        tokenHash: refreshTokenHash,
        tokenFamily,
        userId: user.id,
        expiresAt: refreshTokenExpiresAt,
    });

    logger.info({ userId: user.id }, 'Login bem-sucedido');

    return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
    };
}

// Função para renovar o access token usando refresh token (com rotação e detecção de roubo)
export async function refreshAccessToken(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const storedToken = await authRepository.findRefreshToken(tokenHash);

    if (!storedToken) {
        throw new UnauthorizedError('Refresh token inválido ou expirado');
    }

    if (storedToken.expiresAt < new Date()) {
        throw new UnauthorizedError('Refresh token expirado');
    }

    if (storedToken.user.deletedAt) {
        await authRepository.deleteAllUserRefreshTokens(storedToken.userId);
        throw new UnauthorizedError('Refresh token inválido ou expirado');
    }

    // Detecção de roubo: se um token anterior da mesma family foi reutilizado,
    // isso indica que alguém interceptou o token. Revogamos toda a family.
    const familyTokens = await authRepository.findRefreshTokensByFamily(storedToken.userId, storedToken.tokenFamily);
    const isReused = familyTokens.some(
        (t: { tokenHash: string; createdAt: Date }) => t.tokenHash !== tokenHash && t.createdAt > storedToken.createdAt
    );

    if (isReused) {
        await authRepository.deleteAllUserRefreshTokens(storedToken.userId);
        logger.warn({ userId: storedToken.userId }, 'Possível roubo de refresh token detectado; todas as sessões revogadas');
        throw new UnauthorizedError('Refresh token comprometido; sessões revogadas');
    }

    const accessToken = generateAccessToken({
        id: storedToken.user.id,
        email: storedToken.user.email,
    });

    const newRefreshToken = randomBytes(64).toString('hex');
    const newRefreshTokenHash = hashToken(newRefreshToken);
    const refreshTokenExpiresAt = getRefreshTokenExpiresAt();

    await authRepository.rotateRefreshToken({
        oldTokenHash: tokenHash,
        newTokenHash: newRefreshTokenHash,
        tokenFamily: storedToken.tokenFamily,
        userId: storedToken.userId,
        expiresAt: refreshTokenExpiresAt,
    });

    logger.info({ userId: storedToken.userId }, 'Refresh token rotacionado');

    return { accessToken, refreshToken: newRefreshToken };
}

// Função para invalidar o refresh token (logout)
export async function logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    await authRepository.deleteRefreshToken(tokenHash);
    logger.info({ tokenHashPrefix: tokenHash.slice(0, 8) }, 'Logout realizado');
}

// Função para atualizar os dados do usuário
export async function updateUser(
    id: string,
    data: {
        name?: string;
        email?: string;
        password?: string;
        currentPassword?: string;
    }
) {
    const existingUser = await authRepository.getUserById(id);

    if (!existingUser) {
        throw new NotFoundError('Usuário não encontrado');
    }

    const isChangingSensitive = !!data.email || !!data.password;

    if (isChangingSensitive) {
        if (!data.currentPassword) {
            throw new ForbiddenError('Senha atual é obrigatória para alterar email ou senha');
        }

        const isCurrentPasswordValid = await verifyPassword(existingUser.password, data.currentPassword);
        if (!isCurrentPasswordValid) {
            throw new ForbiddenError('Senha atual incorreta');
        }
    }

    const updateData: { name?: string; email?: string; password?: string } = {};

    if (data.name) {
        updateData.name = data.name.trim();
    }

    if (data.email) {
        const normalizedEmail = data.email.toLowerCase().trim();
        if (normalizedEmail !== existingUser.email) {
            const emailInUse = await authRepository.getUserByEmail(normalizedEmail);
            if (emailInUse) {
                throw new BadRequestError('Email já está em uso');
            }
            updateData.email = normalizedEmail;
        }
    }

    if (data.password) {
        updateData.password = await hashPassword(data.password);
    }

    const updatedUser = await authRepository.updateUser(id, updateData);

    if (isChangingSensitive) {
        await authRepository.deleteAllUserRefreshTokens(id);
        logger.info({ userId: id }, 'Credenciais alteradas; todas as sessões revogadas');
    }

    return sanitizeUser(updatedUser);
}

// Função para deletar um usuário (soft delete)
export async function deleteUser(id: string) {
    const existingUser = await authRepository.getUserById(id);

    if (!existingUser) {
        throw new NotFoundError('Usuário não encontrado');
    }

    await authRepository.deleteAllUserRefreshTokens(id);
    const result = await authRepository.softDeleteUser(id);

    logger.info({ userId: id }, 'Usuário deletado; todas as sessões revogadas');

    return result;
}

// Função para buscar um usuário pelo ID
export async function getUserById(id: string) {
    const user = await authRepository.getUserById(id);

    if (!user) {
        throw new NotFoundError('Usuário não encontrado');
    }

    return sanitizeUser(user);
}

// Função para listar sessões ativas do usuário
export async function listUserSessions(userId: string) {
    const sessions = await authRepository.listUserRefreshTokens(userId);
    return sessions.map((session) => ({
        id: session.id,
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
    }));
}

// Função para revogar todas as sessões do usuário
export async function revokeAllSessions(userId: string) {
    await authRepository.deleteAllUserRefreshTokens(userId);
    logger.info({ userId }, 'Todas as sessões do usuário foram revogadas');
}

export const authService = {
    registerUser,
    verifyEmail,
    resendEmailVerification,
    loginUser,
    refreshAccessToken,
    logout,
    updateUser,
    deleteUser,
    getUserById,
    listUserSessions,
    revokeAllSessions,
};