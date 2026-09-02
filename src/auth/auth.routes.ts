import type { FastifyInstance } from 'fastify';
import { userController } from './user.controller.js';

export async function authRoutes(app: FastifyInstance) {
    app.post('register', userController.registerController);
    app.post('login', userController.loginController);
    app.get('user/:id', userController.getUserByIdController);
    app.put('user/:id', userController.updateUserController);
    app.delete('user/:id', userController.deleteUserController);
}

