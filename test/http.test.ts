import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from '../src/dispatcher';
import { buildRoutes, matchRoute } from '../src/router';
import { Container } from '../src/container';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';

let server: Server;
let base: string;
let container: Container;

beforeAll(async () => {
    container = new Container();
    server = createApp({ controllers: [UsersController], container });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    base = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('router', () => {
    it('будує маршрути з метаданих, а не з захардкодженого списку', () => {
        const table = buildRoutes([UsersController]);
        const paths = table.map((r) => `${r.method} ${r.fullPath}`);
        expect(paths).toContain('GET /users');
        expect(paths).toContain('GET /users/:id');
        expect(paths).toContain('POST /users');
    });

    it('склеює префікс і матчить :id', () => {
        const table = buildRoutes([UsersController]);
        const matched = matchRoute(table, 'GET', '/users/42');
        expect(matched).not.toBeNull();
        expect(matched!.params.id).toBe('42');
    });
});

describe('dispatcher HTTP', () => {
    it('@Param: GET /users/42 повертає тіло, що містить 42', async () => {
        const res = await fetch(`${base}/users/42`);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.id).toBe(42);
    });

    it('@Query: GET /users?limit=1 передає значення в метод', async () => {
        const res = await fetch(`${base}/users?limit=1`);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toHaveLength(1);
    });

    it('невідомий маршрут → 404', async () => {
        const res = await fetch(`${base}/nope`);
        expect(res.status).toBe(404);
    });

    it('@Body + невалідний DTO → 400 зі згадкою поля email', async () => {
        const res = await fetch(`${base}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'not-an-email', name: 'X' }),
        });
        expect(res.status).toBe(400);
        const text = await res.text();
        expect(text).toMatch(/email/);
    });

    it('@Body + валідний DTO → 201, у метод приходить екземпляр DTO', async () => {
        const res = await fetch(`${base}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'ada@example.com', name: 'Ada' }),
        });
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.isDto).toBe(true);
        expect(body.created.email).toBe('ada@example.com');
    });
});

describe('IoC-контейнер задіяно', () => {
    it('контролер отримує сервіс через контейнер, і це той самий singleton', () => {
        const c = new Container();
        const controller = c.resolve(UsersController) as any;
        const serviceDirect = c.resolve(UsersService);
        expect(controller.usersService).toBe(serviceDirect);
        expect(c.resolve(UsersController)).toBe(controller);
    });
});
