// Classes de erro da aplicação para mapeamento correto de status HTTP
export class AppError extends Error {
    statusCode;
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class BadRequestError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
export class UnauthorizedError extends AppError {
    constructor(message = 'Não autorizado') {
        super(message, 401);
    }
}
export class ForbiddenError extends AppError {
    constructor(message = 'Acesso negado') {
        super(message, 403);
    }
}
export class NotFoundError extends AppError {
    constructor(message) {
        super(message, 404);
    }
}
export class TooManyRequestsError extends AppError {
    retryAfterSeconds;
    constructor(retryAfterSeconds, message = 'Muitas tentativas. Tente novamente mais tarde.') {
        super(message, 429);
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
