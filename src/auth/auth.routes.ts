import type { FastifyInstance } from 'fastify';
import { userController } from './auth.controller.js';
import { userSchema } from './auth.schema.js';
import { rateLimitConfig } from '../middleware/rateLimit.js';

export async function authRoutes(app: FastifyInstance) {
    app.post('/register', {
        config: { rateLimit: rateLimitConfig.register },
        schema: {
            tags: ['Auth'],
            description: 'Endpoint para registrar um novo usuário',
            body: userSchema.registerBody,
            response: {
                201: userSchema.registerResponse,
            },
        },
    }, userController.registerController);

    app.post('/verify-email', {
        config: { rateLimit: rateLimitConfig.verifyEmail },
        schema: {
            tags: ['Auth'],
            description: 'Endpoint para verificar email com token',
            body: userSchema.verifyEmailBody,
            response: {
                200: userSchema.errorResponse,
            },
        },
    }, userController.verifyEmailController);

    app.post('/resend-verification', {
        config: { rateLimit: rateLimitConfig.resendVerification },
        schema: {
            tags: ['Auth'],
            description: 'Endpoint para reenviar token de verificação',
            body: userSchema.resendVerificationBody,
            response: {
                200: userSchema.errorResponse,
            },
        },
    }, userController.resendVerificationController);

    app.post('/login', {
        config: { rateLimit: rateLimitConfig.login },
        schema: {
            tags: ['Auth'],
            description: 'Endpoint para autenticar um usuário',
            body: userSchema.loginBody,
            response: {
                200: userSchema.loginResponse,
            },
        },
    }, userController.loginController);

    app.post('/refresh', {
        config: { rateLimit: rateLimitConfig.refresh },
        schema: {
            tags: ['Auth'],
            description: 'Endpoint para renovar o access token via cookie httpOnly',
            response: {
                200: userSchema.refreshResponse,
            },
        },
    }, userController.refreshController);

    app.post('/logout', {
        config: { rateLimit: rateLimitConfig.logout },
        schema: {
            tags: ['Auth'],
            description: 'Endpoint para fazer logout',
            response: {
                204: userSchema.emptyResponse,
            },
        },
    }, userController.logoutController);

    app.get('/me', {
        onRequest: [app.authenticate],
        config: { rateLimit: rateLimitConfig.userRead },
        schema: {
            tags: ['User'],
            description: 'Endpoint para buscar o usuário logado',
            security: [{ bearerAuth: [] }],
            response: {
                200: userSchema.publicUserResponse,
            },
        },
    }, userController.meController);

    app.get('/sessions', {
        onRequest: [app.authenticate],
        config: { rateLimit: rateLimitConfig.userRead },
        schema: {
            tags: ['User'],
            description: 'Endpoint para listar sessões ativas',
            security: [{ bearerAuth: [] }],
            response: {
                200: userSchema.sessionsResponse,
            },
        },
    }, userController.listSessionsController);

    app.delete('/sessions', {
        onRequest: [app.authenticate],
        config: { rateLimit: rateLimitConfig.userWrite },
        schema: {
            tags: ['User'],
            description: 'Endpoint para revogar todas as sessões',
            security: [{ bearerAuth: [] }],
            response: {
                204: userSchema.emptyResponse,
            },
        },
    }, userController.revokeAllSessionsController);

    app.get('/user/:id', {
        onRequest: [app.authenticate],
        config: { rateLimit: rateLimitConfig.userRead },
        schema: {
            tags: ['User'],
            description: 'Endpoint para buscar um usuário por ID',
            security: [{ bearerAuth: [] }],
            params: userSchema.paramsId,
            response: {
                200: userSchema.publicUserResponse,
            },
        },
    }, userController.getUserByIdController);

    app.put('/user/:id', {
        onRequest: [app.authenticate],
        config: { rateLimit: rateLimitConfig.userWrite },
        schema: {
            tags: ['User'],
            description: 'Endpoint para atualizar um usuário',
            security: [{ bearerAuth: [] }],
            params: userSchema.paramsId,
            body: userSchema.updateBody,
            response: {
                200: userSchema.publicUserResponse,
            },
        },
    }, userController.updateUserController);

    app.delete('/user/:id', {
        onRequest: [app.authenticate],
        config: { rateLimit: rateLimitConfig.userWrite },
        schema: {
            tags: ['User'],
            description: 'Endpoint para deletar um usuário',
            security: [{ bearerAuth: [] }],
            params: userSchema.paramsId,
            response: {
                204: userSchema.emptyResponse,
            },
        },
    }, userController.deleteUserController);
}
