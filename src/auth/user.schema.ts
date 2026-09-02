import { z } from 'zod';

const uuidMessage = 'ID deve ser um UUID válido';
const emailMessage = 'E-mail inválido';
const passwordMessage = 'A senha deve ter no mínimo 6 caracteres';
const nameMessage = 'O nome deve ter no mínimo 2 caracteres';

export const paramsIdSchema = z.object({
  id: z.string().uuid({ message: uuidMessage }),
});

export const registerBodySchema = z.object({
  name: z.string().min(2, { message: nameMessage }),
  email: z.string().email({ message: emailMessage }),
  password: z.string().min(6, { message: passwordMessage }),
});

export const loginBodySchema = z.object({
  email: z.string().email({ message: emailMessage }),
  password: z.string().min(6, { message: passwordMessage }),
});

export const updateBodySchema = z.object({
  name: z.string().min(2, { message: nameMessage }).optional(),
  email: z.string().email({ message: emailMessage }).optional(),
  password: z.string().min(6, { message: passwordMessage }).optional(),
});

export const userResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const publicUserResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string().email(),
});

export const loginResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string().email(),
});

export const errorResponseSchema = z.object({
  message: z.string(),
});

const userResponseJson = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'name', 'email', 'createdAt', 'updatedAt'],
} as const;

const publicUserResponseJson = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
  },
  required: ['id', 'name', 'email'],
} as const;

const loginResponseJson = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
  },
  required: ['id', 'name', 'email'],
} as const;

const errorResponseJson = {
  type: 'object',
  properties: {
    message: { type: 'string' },
  },
  required: ['message'],
} as const;

export const userSchema = {
  userResponse: userResponseJson,
  publicUserResponse: publicUserResponseJson,
  loginResponse: loginResponseJson,
  errorResponse: errorResponseJson,
};

export const userZod = {
  paramsId: paramsIdSchema,
  registerBody: registerBodySchema,
  loginBody: loginBodySchema,
  updateBody: updateBodySchema,
};

export type RegisterUserBody = z.infer<typeof registerBodySchema>;
export type LoginUserBody = z.infer<typeof loginBodySchema>;
export type UpdateUserBody = z.infer<typeof updateBodySchema>;
export type ParamsId = z.infer<typeof paramsIdSchema>;
