import type { FastifyInstance } from 'fastify';
import { userController } from './user.controller.js';
import { userSchema, userZod } from './user.schema.js';

export async function authRoutes(app: FastifyInstance) {
  app.post(
    '/register',
    {
      schema: {
        body: userZod.registerBody,
        response: {
          201: userSchema.publicUserResponse,
          400: userSchema.errorResponse,
          409: userSchema.errorResponse,
        },
        tags: ['Auth'],
        description: 'Cadastra um novo usuário',
      },
    },
    userController.registerController
  );

  app.post(
    '/login',
    {
      schema: {
        body: userZod.loginBody,
        response: {
          200: userSchema.loginResponse,
          400: userSchema.errorResponse,
          401: userSchema.errorResponse,
          404: userSchema.errorResponse,
        },
        tags: ['Auth'],
        description: 'Autentica um usuário existente',
      },
    },
    userController.loginController
  );

  app.get(
    '/user/:id',
    {
      schema: {
        params: userZod.paramsId,
        response: {
          200: userSchema.publicUserResponse,
          400: userSchema.errorResponse,
          404: userSchema.errorResponse,
        },
        tags: ['Users'],
        description: 'Busca um usuário pelo ID',
      },
    },
    userController.getUserByIdController
  );

  app.put(
    '/user/:id',
    {
      schema: {
        params: userZod.paramsId,
        body: userZod.updateBody,
        response: {
          200: userSchema.userResponse,
          400: userSchema.errorResponse,
          404: userSchema.errorResponse,
        },
        tags: ['Users'],
        description: 'Atualiza os dados de um usuário',
      },
    },
    userController.updateUserController
  );

  app.delete(
    '/user/:id',
    {
      schema: {
        params: userZod.paramsId,
        response: {
          204: { type: 'object' },
          400: userSchema.errorResponse,
          404: userSchema.errorResponse,
        },
        tags: ['Users'],
        description: 'Remove um usuário',
      },
    },
    userController.deleteUserController
  );
}
