import 'reflect-metadata';

type InjectableOptions = { scope?: 'singleton' | 'transient' };

export function Injectable(options?: InjectableOptions) {
    return function(target: any) {
        const scope = options?.scope ?? 'singleton';
        Reflect.defineMetadata('scope', scope, target);
    }
}