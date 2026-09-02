import { authRepository } from '../repositories/auth.js';
import argon2 from 'argon2';

// Função para registrar um novo usuário
export async function registerUser
    (data: {
        name: string,
        email: string,
        password: string
    }) {
    const existingUser = await authRepository.getUserByEmail(data.email)

    if (existingUser) {
        throw new Error('Usuario já existe')

    }

    //Nesse ponto, vamos criptografar a senha do usuário antes
    //  de salvar no banco de dados
    const hashedPassword = await argon2.hash(data.password);

    const newUser = await authRepository.createUser({
        name: data.name,
        email: data.email,
        password: hashedPassword
    })
    return newUser
}

// Função para autenticar um usuário existente
export async function loginUser(data: {
    email: string,
    password: string
}) {

    const user = await authRepository.getUserByEmail(data.email)

    if (!user ) {
        throw new Error('Usuario não encontrado')
    }

    // Verificar se a senha está correta
    const isPasswordValid = await argon2.verify(user.password, data.password);

    if (!isPasswordValid) {
        throw new Error('Senha incorreta')
    }

    return user
}


// Função para atualizar os dados do usuário
export async function updateUser(
    id: string,
    data: {
        name?: string;
        email?: string;
        password?: string;
    }
) {
    const existingUser = await authRepository.getUserById(id);

    if (!existingUser) {
        throw new Error('Usuário não encontrado');
    }

    const updateData = { ...data };

    if (data.password) {
        updateData.password = await argon2.hash(data.password);
    }

    return authRepository.updateUser(id, updateData);
}


// Função para deletar um usuário
export async function deleteUser (id:string) {
    const existingUser = await authRepository.getUserById(id);

    if (!existingUser) {
        throw new Error('Usuário não encontrado');
    }

    return authRepository.deleteUser(id);
}

// Função para buscar um usuário pelo ID
export async function getUserById(id: string) {
    const user = await authRepository.getUserById(id);

    if (!user) {
        throw new Error('Usuário não encontrado');
    }

    return {
        id: user.id,
        name: user.name,
    };
}



export const authService = { 
    registerUser,
    loginUser,
    updateUser,
    deleteUser,
    getUserById
}