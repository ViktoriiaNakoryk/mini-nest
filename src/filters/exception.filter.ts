import {ExceptionFilter} from '../lifecycle/types';
import {NotFoundError, ForbiddenError, ValidationError} from '../errors';

export class DefaultExceptionFilter implements ExceptionFilter {
    catch(err: unknown): { status: number; body: any } {
        if (err instanceof ValidationError) {
            return {
                status: 400,
                body: {statusCode: 400, message: 'Validation failed', errors: err.issues},
            };
        }

        if (err instanceof NotFoundError) {
            return {
                status: 404,
                body: {statusCode: 404, message: err.message || 'Not Found'},
            };
        }

        if (err instanceof ForbiddenError) {
            return {
                status: 403,
                body: {statusCode: 403, message: err.message || 'Forbidden'},
            };
        }

        return {
            status: 500,
            body: {statusCode: 500, message: 'Internal Server Error'},
        };
    }
}
