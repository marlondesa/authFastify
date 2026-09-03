import { authService } from './auth.service.js';
// Função para registrar um novo usuário
export async function registerController(request, reply) {
    const { name, email, password } = request.body;
    const user = await authService.registerUser({ name, email, password });
    return reply.status(201).send({
        id: user.id,
        name: user.name,
        email: user.email,
    });
}
// Função para autenticar um usuário existente
export async function loginController(request, reply) {
    const { email, password } = request.body;
    const result = await authService.loginUser({ email, password });
    return reply.send(result);
}
// Função para renovar o access token
export async function refreshController(request, reply) {
    const { refreshToken } = request.body;
    const result = await authService.refreshAccessToken(refreshToken);
    return reply.send(result);
}
// Função para fazer logout
export async function logoutController(request, reply) {
    const { refreshToken } = request.body;
    await authService.logout(refreshToken);
    return reply.status(204).send();
}
// Função para buscar um usuário pelo ID
export async function getUserByIdController(request, reply) {
    const { id } = request.params;
    const user = await authService.getUserById(id);
    return reply.send(user);
}
// Função para atualizar os dados do usuário
export async function updateUserController(request, reply) {
    const { id } = request.params;
    const { name, email, password } = request.body;
    const user = await authService.updateUser(id, { name, email, password });
    return reply.send(user);
}
// Função para deletar um usuário
export async function deleteUserController(request, reply) {
    const { id } = request.params;
    await authService.deleteUser(id);
    return reply.status(204).send();
}
export const userController = {
    registerController,
    loginController,
    refreshController,
    logoutController,
    getUserByIdController,
    updateUserController,
    deleteUserController,
};
