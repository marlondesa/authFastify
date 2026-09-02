import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

// Aqui Nos busca o email e retorna 
export async function getUserByEmail(email: string) {
    return await prisma.user.findUnique({
        where: { email }
    });
}


// AQUI NOS BUSCA O USUARIO PELO ID 
export async function getUserById(id: string) {
    return await prisma.user.findUnique({
        where: { id: Number(id) },
    });
}

// Aqui é a rota de criar 
export async function createUser(data: { 
    name: string,
     email: string, password: string }) {

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: data.password
    }
  })

  return user
}


//Atualiza o usuario pelo ID, e retorna o usuario atualizado

export async function updateUser(
    id: string,
    data: { 
        name?: string,
        email?: string,
        password?: string
    }
) {
    return await prisma.user.update({
        where: { id: Number(id) },
        data
    });
}

//Deletar usuario pelo ID, e retorna o usuario deletado
export async function deleteUser(id: string) {
    return await prisma.user.delete({
        where: { id: Number(id) }
    });
}

export const authRepository = {
    getUserByEmail,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};