import { z } from 'zod';
const strongPasswordSchema = z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(128, 'Senha deve ter no máximo 128 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/\d/, 'Senha deve conter pelo menos um número')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Senha deve conter pelo menos um caractere especial');
const emailSchema = z.string().email('Email inválido').transform((v) => v.toLowerCase().trim());
const nameSchema = z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome muito longo').transform((v) => v.trim());
// Schema para o corpo da requisição de registro do usuário
export const registerBodySchema = z.object({
    name: nameSchema,
    email: emailSchema,
    password: strongPasswordSchema,
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
});
// Schema para o corpo da requisição de login do usuário
export const loginBodySchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Senha é obrigatória'),
});
// Schema para o corpo da requisição de atualização do usuário
export const updateBodySchema = z.object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    password: strongPasswordSchema.optional(),
    currentPassword: z.string().min(1, 'Senha atual é obrigatória').optional(),
}).strict().refine((data) => {
    const isChangingSensitive = data.email || data.password;
    return !isChangingSensitive || !!data.currentPassword;
}, {
    message: 'Senha atual é obrigatória para alterar email ou senha',
    path: ['currentPassword'],
});
// Schema para o corpo da requisição de verificação de email
export const verifyEmailBodySchema = z.object({
    token: z.string().min(1, 'Token é obrigatório'),
});
// Schema para o corpo da requisição de nova tentativa de verificação de email
export const resendVerificationBodySchema = z.object({
    email: emailSchema,
});
// Schema para solicitar recuperação de senha
export const forgotPasswordBodySchema = z.object({
    email: emailSchema,
});
// Schema para redefinir senha com token
export const resetPasswordBodySchema = z.object({
    token: z.string().min(1, 'Token é obrigatório'),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
});
// Schema para os parâmetros da rota que busca um usuário por ID
export const paramsIdSchema = z.object({
    id: z.string().uuid('ID inválido'),
});
// Schema para a resposta pública do usuário (sem senha)
export const publicUserResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
});
// Schema para a resposta de login com access token (refresh vai em cookie httpOnly)
export const loginResponseSchema = z.object({
    user: z.object({
        id: z.string().uuid(),
        name: z.string(),
        email: z.string().email(),
        createdAt: z.string().datetime(),
        updatedAt: z.string().datetime(),
    }),
    accessToken: z.string(),
});
// Schema para a resposta de refresh token
export const refreshResponseSchema = z.object({
    accessToken: z.string(),
});
// Schema para resposta vazia (HTTP 204)
export const emptyResponseSchema = z.void();
// Schema para a resposta de erro
export const errorResponseSchema = z.object({
    message: z.string(),
});
// Schema para a resposta de registro
export const registerResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    message: z.string(),
});
// Schema para a resposta de listagem de sessões
export const sessionsResponseSchema = z.object({
    sessions: z.array(z.object({
        id: z.string().uuid(),
        createdAt: z.string().datetime(),
        expiresAt: z.string().datetime(),
    })),
});
// Exportando todos os schemas em um objeto para facilitar a importação
export const userSchema = {
    registerBody: registerBodySchema,
    registerResponse: registerResponseSchema,
    loginBody: loginBodySchema,
    updateBody: updateBodySchema,
    verifyEmailBody: verifyEmailBodySchema,
    resendVerificationBody: resendVerificationBodySchema,
    forgotPasswordBody: forgotPasswordBodySchema,
    resetPasswordBody: resetPasswordBodySchema,
    paramsId: paramsIdSchema,
    publicUserResponse: publicUserResponseSchema,
    loginResponse: loginResponseSchema,
    refreshResponse: refreshResponseSchema,
    emptyResponse: emptyResponseSchema,
    errorResponse: errorResponseSchema,
    sessionsResponse: sessionsResponseSchema,
};
