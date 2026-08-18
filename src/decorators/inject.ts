import 'reflect-metadata';

export function Inject(token: any) {
    return function (target: any, _key: any, index: number) {
        const existing = Reflect.getMetadata('inject:tokens', target) || {};
        existing[index] = token;
        Reflect.defineMetadata('inject:tokens', existing, target);
    };
}