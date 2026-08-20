import {ZodType, ZodError} from 'zod';
import {Pipe, PipeMeta} from '../lifecycle/types';
import {ValidationError, FieldIssue} from '../errors';

export class ZodValidationPipe implements Pipe {
    transform(value: any, meta: PipeMeta): any {
        const schema: ZodType | undefined = meta.schema;
        if (!schema) {
            return value;
        }

        const result = schema.safeParse(value);
        if (!result.success) {
            const issues: FieldIssue[] = (result.error as ZodError).issues.map((i) => ({
                field: i.path.join('.') || '(root)',
                message: i.message,
            }));
            throw new ValidationError(issues);
        }
        return result.data;
    }
}
