import 'reflect-metadata';
import {describe, it, expect, afterAll} from 'vitest';
import type {Server} from 'node:http';
import {createApp, CreateAppOptions} from '../src/dispatcher';
import {Container} from '../src/container';
import {Controller} from '../src/decorators/controller';
import {Get} from '../src/decorators/methods';
import {AuthGuard} from '../src/guards/auth.guard';
import {LoggingInterceptor} from '../src/interceptors/logging.interceptor';
import {ZodValidationPipe} from '../src/pipes/zod-validation.pipe';
import {NotFoundError} from '../src/errors';
import {UsersController} from '../src/users/users.controller';

const servers: Server[] = [];

afterAll(async () => {
    await Promise.all(
        servers.map((s) => new Promise<void>((resolve) => s.close(() => resolve()))),
    );
});

async function start(opts: Omit<CreateAppOptions, 'container'> & { container?: Container }): Promise<string> {
    const server = createApp({container: new Container(), ...opts});
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    return `http://127.0.0.1:${port}`;
}

let secureHandlerCalls = 0;

@Controller('secure')
class SecureController {
    @Get()
    handle() {
        secureHandlerCalls++;
        return {ok: true};
    }
}

describe('Guard блокує до обробника', () => {
    it('без Authorization → 403 і обробник не викликається', async () => {
        secureHandlerCalls = 0;
        const base = await start({controllers: [SecureController], guards: [new AuthGuard()]});

        const res = await fetch(`${base}/secure`);
        expect(res.status).toBe(403);
        expect(secureHandlerCalls).toBe(0);

        const ok = await fetch(`${base}/secure`, {headers: {Authorization: 'token'}});
        expect(ok.status).toBe(200);
        expect(secureHandlerCalls).toBe(1);
    });
});

// ── Interceptor ────────────────────────────────────────────────────────────
@Controller('timed')
class TimedController {
    @Get()
    handle() {
        return {ok: true};
    }
}

describe('Interceptor міряє час', () => {
    it('логує рядок із маршрутом і мілісекундами', async () => {
        const logs: string[] = [];
        const base = await start({
            controllers: [TimedController],
            interceptors: [new LoggingInterceptor((line) => logs.push(line))],
        });

        await fetch(`${base}/timed`);

        const line = logs.find((l) => /ms/.test(l));
        expect(line).toBeDefined();
        expect(line).toMatch(/\/timed/);
        expect(line).toMatch(/[0-9]+(\.[0-9]+)? ?ms/);
    });
});

@Controller('boom')
class BoomController {
    @Get()
    handle() {
        throw new Error('boom');
    }
}

@Controller('missing')
class MissingController {
    @Get()
    handle() {
        throw new NotFoundError('widget 7 not found');
    }
}

describe('Exception filter мапить помилки', () => {
    it('неочікувана помилка → 500 без слова boom і стек-трейсу', async () => {
        const base = await start({controllers: [BoomController]});
        const res = await fetch(`${base}/boom`);
        expect(res.status).toBe(500);
        const text = await res.text();
        expect(text).not.toMatch(/boom|at .*\.ts:/);
    });

    it('доменна NotFoundError → 404 з осмисленим повідомленням', async () => {
        const base = await start({controllers: [MissingController]});
        const res = await fetch(`${base}/missing`);
        expect(res.status).toBe(404);
        const body = await res.json();
        expect(body.message).toMatch(/not found/i);
    });

    it('невалідне тіло через Zod-pipe → 400 зі списком полів', async () => {
        const base = await start({controllers: [UsersController], pipes: [new ZodValidationPipe()]});
        const res = await fetch(`${base}/users`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: 'nope', name: ''}),
        });
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.errors.map((e: any) => e.field)).toContain('email');
    });
});

describe('AsyncLocalStorage і X-Request-Id', () => {
    it('глибокий сервіс читає той самий requestId, що й у заголовку відповіді', async () => {
        const base = await start({controllers: [UsersController]});
        const res = await fetch(`${base}/users/1`);
        expect(res.status).toBe(200);
        const header = res.headers.get('x-request-id');
        const body = await res.json();
        expect(body.requestId).toBe(header);
    });

    it('повертає клієнтський X-Request-Id, якщо він надісланий', async () => {
        const base = await start({controllers: [UsersController]});
        const res = await fetch(`${base}/users/1`, {headers: {'X-Request-Id': 'my-id-123'}});
        expect(res.headers.get('x-request-id')).toBe('my-id-123');
        const body = await res.json();
        expect(body.requestId).toBe('my-id-123');
    });

    it('10 паралельних запитів не змішують контексти', async () => {
        const base = await start({controllers: [UsersController]});
        const ids = Array.from({length: 10}, (_, i) => `req-${i}`);

        const results = await Promise.all(
            ids.map(async (id) => {
                const res = await fetch(`${base}/users/1`, {headers: {'X-Request-Id': id}});
                const body = await res.json();
                return {sent: id, header: res.headers.get('x-request-id'), seen: body.requestId};
            }),
        );

        for (const r of results) {
            expect(r.header).toBe(r.sent);
            expect(r.seen).toBe(r.sent);
        }
    });
});
