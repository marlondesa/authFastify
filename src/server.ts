import { fastify } from 'fastify';
import { fastifyCors } from '@fastify/cors';
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import { authRoutes } from './auth/auth.routes.js';
import { userController } from './auth/user.controller.js';
import { userSchema } from './auth/user.schema.js';

const app = fastify();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyCors, { origin: '*' });

app.register(fastifySwagger, {
    openapi: {
        info: {
            title: 'Fastfy API',
            version: '1.0.0',
        },
    },
});

// Aqui salvamos os endpoints da nossa aplicação, e o
// fastifySwaggerUi é o que vai gerar a documentação da nossa API
app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
});

app.register(authRoutes, { prefix: '/api' });

// listar os enpoint
app.post('/register', {
  schema: {
    body: userSchema.registerBody,
    response: {
      201: userSchema.registerResponse,
    },
  },
}, userController.registerController);






//So para testar se o servidor está funcionando, podemos criar uma rota simples
app.get('/', () => {
    return 'Hello World';
});

app.listen({
    port: 3333,
}).then(() => {
    console.log('HTTP server running!');
});

export default app;
