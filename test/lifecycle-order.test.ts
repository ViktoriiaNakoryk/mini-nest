import 'reflect-metadata';
import {describe, it, expect, beforeAll, afterAll} from 'vitest';
import type {Server} from 'node:http';
import {createApp} from '../src/dispatcher';
import {Container} from '../src/container';
import {Controller} from '../src/decorators/controller';
import {Get} from '../src/decorators/methods';
import {Query} from '../src/decorators/params';
import {Middleware, Guard, Interceptor, Pipe} from '../src/lifecycle/types';

const calls: string[] = [];

@Controller('order')
class OrderController {
    @Get()
    handle(@Query('x') _x?: string) {
        calls.push('handler');
        return {ok: true};
    }
}

const middleware: Middleware = () => {
    calls.push('middleware');
};

const guard: Guard = {
    canActivate: () => {
        calls.push('guard');
        return true;
    },
};

const interceptor: Interceptor = {
    async intercept(_ctx, next) {
        calls.push('interceptor:before');
        const result = await next();
        calls.push('interceptor:after');
        return result;
    },
};

const pipe: Pipe = {
    transform(value) {
        calls.push('pipe');
        return value;
    },
};

let server: Server;
let base: string;

beforeAll(async () => {
    server = createApp({
        controllers: [OrderController],
        container: new Container(),
        middleware: [middleware],
        guards: [guard],
        interceptors: [interceptor],
        pipes: [pipe],
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    base = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('порядок життєвого циклу', () => {
    it('етапи викликаються рівно в очікуваній послідовності', async () => {
        calls.length = 0;
        const res = await fetch(`${base}/order?x=1`);
        expect(res.status).toBe(200);

        expect(calls).toEqual([
            'middleware',
            'guard',
            'interceptor:before',
            'pipe',
            'handler',
            'interceptor:after',
        ]);
    });
});
