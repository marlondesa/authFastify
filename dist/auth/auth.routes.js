import { userController } from './auth.controller.js';
import { userSchema } from './auth.schema.js';
export async function authRoutes(app) {
    app.post('/register', {
        schema: {
            tags: ['Auth'],
            description: 'Endpoint para registrar um novo usuário',
            body: userSchema.registerBody,
            response: {
                201: userSchema.publicUserResponse,
            },
        },
    }, userController.registerController);
    app.post('/login', {
        config: {
            rateLimit: {
                max: 5,
                timeWindow: '1 minute',
            },
        },
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
        schema: {
            tags: ['Auth'],
            description: 'Endpoint para renovar o access token',
            body: userSchema.refreshBody,
            response: {
                200: userSchema.refreshResponse,
            },
        },
    }, userController.refreshController);
    app.post('/logout', {
        schema: {
            tags: ['Auth'],
            description: 'Endpoint para fazer logout',
            body: userSchema.logoutBody,
            response: {
                204: userSchema.errorResponse,
            },
        },
    }, userController.logoutController);
    app.get('/user/:id', {
        onRequest: [app.authenticate],
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
        schema: {
            tags: ['User'],
            description: 'Endpoint para deletar um usuário',
            security: [{ bearerAuth: [] }],
            params: userSchema.paramsId,
            response: {
                204: userSchema.errorResponse,
            },
        },
    }, userController.deleteUserController);
}
