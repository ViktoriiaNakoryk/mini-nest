import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Injectable } from '../src/decorators/injectable';
import { Inject } from '../src/decorators/inject';
import { Container } from '../src/container';
import { CONFIG } from '../src/tokens';

describe('Container', () => {
    it('resolves a simple dependency graph recursively (A -> B -> C)', () => {
        @Injectable()
        class C {}

        @Injectable()
        class B {
            constructor(public c: C) {}
        }

        @Injectable()
        class A {
            constructor(public b: B) {}
        }

        const container = new Container();
        const a = container.resolve(A);

        expect(a).toBeInstanceOf(A);
        expect(a.b).toBeInstanceOf(B);
        expect(a.b.c).toBeInstanceOf(C);
    });

    it('returns the same instance for singleton scope', () => {
        @Injectable()
        class SingletonService {}

        const container = new Container();

        expect(container.resolve(SingletonService)).toBe(container.resolve(SingletonService));
    });

    it('returns different instances for transient scope', () => {
        @Injectable({ scope: 'transient' })
        class TransientService {}

        const container = new Container();

        expect(container.resolve(TransientService)).not.toBe(container.resolve(TransientService));
    });

    it('throws a readable error for a circular dependency', () => {
        class CircularA {
            constructor(public b: any) {}
        }

        class CircularB {
            constructor(public a: any) {}
        }

        Reflect.defineMetadata('design:paramtypes', [CircularB], CircularA);
        Reflect.defineMetadata('design:paramtypes', [CircularA], CircularB);

        const container = new Container();

        expect(() => container.resolve(CircularA)).toThrow(/CircularA -> CircularB -> CircularA/);
    });

    it('resolves a dependency by an @Inject token', () => {
        interface Config {
            apiUrl: string;
        }

        @Injectable()
        class ApiService {
            constructor(@Inject(CONFIG) public config: Config) {}
        }

        const container = new Container();
        container.register(CONFIG, { apiUrl: 'https://example.com' });

        const api = container.resolve(ApiService);

        expect(api.config.apiUrl).toBe('https://example.com');
    });
});