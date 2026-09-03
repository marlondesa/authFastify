import 'dotenv/config';
import { fastify } from 'fastify';
import { fastifyCors } from '@fastify/cors';
import { fastifyJwt } from '@fastify/jwt';
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { fastifyRateLimit } from '@fastify/rate-limit';
import { validatorCompiler, serializerCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod';
import { authRoutes } from './auth/auth.routes.js';
import { authService } from './auth/auth.service.js';
const app = fastify().withTypeProvider();
// Injeta a instância do Fastify no serviço de autenticação para gerar JWT
authService.setFastifyInstance(app);
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
// CORS restrito para origens definidas em ALLOWED_ORIGINS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || ['http://localhost:3000'];
app.register(fastifyCors, {
    origin: allowedOrigins,
    credentials: true,
});
// Rate limiting global com limite mais restrito no login
app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
});
// Configuração do JWT para autenticação
app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'fallback_secret_key',
    cookie: {
        cookieName: 'token',
        signed: false,
    },
});
app.decorate('authenticate', async (request, reply) => {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.status(401).send({ message: 'Não autorizado' });
    }
});
// Tratamento global de erros
app.setErrorHandler((error, _request, reply) => {
    if (error.message.includes('Não autorizado')) {
        return reply.status(401).send({ message: 'Não autorizado' });
    }
    if (error.message.includes('não encontrado') ||
        error.message.includes('não existe') ||
        error.message.includes('incorreta') ||
        error.message.includes('já está em uso') ||
        error.message.includes('inválido ou expirado')) {
        return reply.status(400).send({ message: error.message });
    }
    if (error.validation) {
        return reply.status(400).send({ message: 'Dados inválidos', errors: error.validation });
    }
    console.error(error);
    return reply.status(500).send({ message: 'Erro interno do servidor' });
});
// Configuração do Swagger para documentação da API
app.register(fastifySwagger, {
    openapi: {
        info: {
            title: 'Fastfy API',
            version: '1.0.0',
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    transform: jsonSchemaTransform,
});
// Registrar as rotas de autenticação
app.register(authRoutes, { prefix: '/api' });
// Rota de teste para verificar se o servidor está funcionando
app.get('/', () => {
    return 'Hello World';
});
// Configuração do Swagger UI para visualização da documentação
app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
});
// Iniciar o servidor na porta definida em PORT ou 3333
const port = Number(process.env.PORT) || 3333;
app.listen({
    port,
}).then(() => {
    console.log(`HTTP server running on port ${port}!`);
});
export default app;
