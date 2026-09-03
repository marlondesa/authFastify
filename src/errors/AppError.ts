// Classes de erro da aplicação para mapeamento correto de status HTTP

export class AppError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Não autorizado') {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Acesso negado') {
        super(message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404);
    }
}

export class TooManyRequestsError extends AppError {
    public readonly retryAfterSeconds: number;

    constructor(retryAfterSeconds: number, message: string = 'Muitas tentativas. Tente novamente mais tarde.') {
        super(message, 429);
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
