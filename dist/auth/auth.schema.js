import { z } from 'zod';
// Schema para o corpo da requisição de registro do usuário
export const registerBodySchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});
// Schema para o corpo da requisição de login do usuário
export const loginBodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
// Schema para o corpo da requisição de atualização do usuário
export const updateBodySchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
});
// Schema para os parâmetros da rota que busca um usuário por ID
export const paramsIdSchema = z.object({
    id: z.string().uuid(),
});
// Schema para a resposta pública do usuário (sem senha)
export const publicUserResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
});
// Schema para a resposta de login com access e refresh tokens
export const loginResponseSchema = z.object({
    user: z.object({
        id: z.string().uuid(),
        name: z.string(),
        email: z.string().email(),
        createdAt: z.string().datetime(),
        updatedAt: z.string().datetime(),
    }),
    accessToken: z.string(),
    refreshToken: z.string(),
});
// Schema para o corpo da requisição de refresh token
export const refreshBodySchema = z.object({
    refreshToken: z.string(),
});
// Schema para a resposta de refresh token
export const refreshResponseSchema = z.object({
    accessToken: z.string(),
});
// Schema para o corpo da requisição de logout
export const logoutBodySchema = z.object({
    refreshToken: z.string(),
});
// Schema para a resposta de erro
export const errorResponseSchema = z.object({
    message: z.string(),
});
// Exportando todos os schemas em um objeto para facilitar a importação
export const userSchema = {
    registerBody: registerBodySchema,
    loginBody: loginBodySchema,
    updateBody: updateBodySchema,
    paramsId: paramsIdSchema,
    publicUserResponse: publicUserResponseSchema,
    loginResponse: loginResponseSchema,
    refreshBody: refreshBodySchema,
    refreshResponse: refreshResponseSchema,
    logoutBody: logoutBodySchema,
    errorResponse: errorResponseSchema,
};
