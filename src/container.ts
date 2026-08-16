import 'reflect-metadata';

export class Container {
    private cache = new Map<any, any>();
    private providers = new Map<any, any>();

    register(token: any, value: any): void {
        this.providers.set(token, value);
    }

    resolve(Target: any, path: any[] = []): any {
        if (path.includes(Target)) {
            const chain = [...path, Target].map((t: any) => t.name).join(' -> ');
            throw new Error(`Циклічна залежність: ${chain}`);
        }

        const scope = Reflect.getMetadata('scope', Target) || 'singleton';
        if (scope === 'singleton' && this.cache.has(Target)) {
            return this.cache.get(Target);
        }

        const paramtypes = Reflect.getMetadata('design:paramtypes', Target) || [];
        const injectTokens = Reflect.getMetadata('inject:tokens', Target) || {};
        const deps = paramtypes.map((dep: any, index: number) => {
            const token = injectTokens[index];
            if (token !== undefined) {
                if (!this.providers.has(token)) {
                    throw new Error(`Немає провайдера для токена: ${String(token)}`);
                }
                return this.providers.get(token);
            }
            return this.resolve(dep, [...path, Target]);
        });
        const newTarget = new Target(...deps);

        if (scope === 'singleton' && !this.cache.has(Target)) {
            this.cache.set(Target, newTarget);
        }

        return newTarget;
    }
}