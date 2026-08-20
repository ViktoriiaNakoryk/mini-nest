export class NotFoundError extends Error {
    constructor(message = 'Not Found') {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class ForbiddenError extends Error {
    constructor(message = 'Forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

export interface FieldIssue {
    field: string;
    message: string;
}

export class ValidationError extends Error {
    constructor(public readonly issues: FieldIssue[]) {
        super('Validation failed');
        this.name = 'ValidationError';
    }
}
