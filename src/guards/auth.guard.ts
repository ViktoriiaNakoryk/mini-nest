import {Guard, ExecutionContext} from '../lifecycle/types';

export class AuthGuard implements Guard {
    canActivate(ctx: ExecutionContext): boolean {
        const auth = ctx.req.headers['authorization'];
        return typeof auth === 'string' && auth.trim().length > 0;
    }
}
