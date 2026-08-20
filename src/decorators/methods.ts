import 'reflect-metadata';

export const ROUTES_METADATA = 'controller:routes';

export type HttpMethod = 'GET' | 'POST';

export interface RouteDefinition {
    method: HttpMethod;
    path: string;
    handlerName: string;
}

function createMethodDecorator(method: HttpMethod) {
    return function (path: string = '') {
        return function (target: any, propertyKey: string) {
            const ctor = target.constructor;
            const routes: RouteDefinition[] =
                Reflect.getMetadata(ROUTES_METADATA, ctor) || [];

            const normalized = ('/' + path).replace(/\/+/g, '/').replace(/\/$/, '');

            routes.push({method, path: normalized, handlerName: propertyKey});
            Reflect.defineMetadata(ROUTES_METADATA, routes, ctor);
        };
    };
}

export const Get = createMethodDecorator('GET');
export const Post = createMethodDecorator('POST');
