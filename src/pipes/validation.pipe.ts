import 'reflect-metadata';
import {plainToInstance} from 'class-transformer';
import {validate} from 'class-validator';

export interface ValidationError {
    field: string;
    constraints: Record<string, string>;
}

export class ValidationException extends Error {
    constructor(public readonly errors: ValidationError[]) {
        super('Validation failed');
        this.name = 'ValidationException';
    }
}

function isPlainType(type: any): boolean {
    return (
        type === undefined ||
        type === String ||
        type === Number ||
        type === Boolean ||
        type === Object ||
        type === Array
    );
}

export async function validationPipe(value: any, metatype: any): Promise<any> {
    if (isPlainType(metatype)) {
        return value;
    }

    const instance = plainToInstance(metatype, value);
    const errors = await validate(instance as object);

    if (errors.length > 0) {
        const formatted: ValidationError[] = errors.map((e) => ({
            field: e.property,
            constraints: e.constraints ?? {},
        }));
        throw new ValidationException(formatted);
    }

    return instance;
}
