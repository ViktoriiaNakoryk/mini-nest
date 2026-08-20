import {Interceptor, ExecutionContext} from '../lifecycle/types';

export class LoggingInterceptor implements Interceptor {
    constructor(private readonly log: (line: string) => void = console.log) {
    }

    async intercept(ctx: ExecutionContext, next: () => Promise<any>): Promise<any> {
        const start = performance.now();
        try {
            return await next();
        } finally {
            const ms = (performance.now() - start).toFixed(1);
            this.log(`${ctx.method} ${ctx.path} — ${ms} ms`);
        }
    }
}
