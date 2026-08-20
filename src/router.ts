import 'reflect-metadata';
import {PREFIX_METADATA} from './decorators/controller';
import {ROUTES_METADATA, RouteDefinition, HttpMethod} from './decorators/methods';
import {PARAMS_METADATA, ClassParamsMap, MethodParamsMap} from './decorators/params';

export interface Route {
    method: HttpMethod;
    fullPath: string;
    regexp: RegExp;
    paramNames: string[];
    controllerClass: any;
    handlerName: string;
    paramsMap: MethodParamsMap;
    paramTypes: any[];
}

function pathToRegexp(fullPath: string): { regexp: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];
    const pattern = fullPath.replace(/:([^/]+)/g, (_match, name) => {
        paramNames.push(name);
        return '([^/]+)';
    });
    return {regexp: new RegExp(`^${pattern}/?$`), paramNames};
}

export function buildRoutes(controllers: any[]): Route[] {
    const table: Route[] = [];

    for (const controllerClass of controllers) {
        const prefix: string =
            Reflect.getMetadata(PREFIX_METADATA, controllerClass) || '';
        const routes: RouteDefinition[] =
            Reflect.getMetadata(ROUTES_METADATA, controllerClass) || [];
        const allParams: ClassParamsMap =
            Reflect.getMetadata(PARAMS_METADATA, controllerClass) || {};

        for (const route of routes) {
            const fullPath = (prefix + route.path).replace(/\/+/g, '/').replace(/(.)\/$/, '$1') || '/';
            const {regexp, paramNames} = pathToRegexp(fullPath);
            const paramTypes: any[] =
                Reflect.getMetadata('design:paramtypes', controllerClass.prototype, route.handlerName) || [];

            table.push({
                method: route.method,
                fullPath,
                regexp,
                paramNames,
                controllerClass,
                handlerName: route.handlerName,
                paramsMap: allParams[route.handlerName] || {},
                paramTypes,
            });
        }
    }

    return table;
}

export function matchRoute(
    table: Route[],
    method: string,
    pathname: string,
): { route: Route; params: Record<string, string> } | null {
    for (const route of table) {
        if (route.method !== method) continue;
        const m = route.regexp.exec(pathname);
        if (!m) continue;

        const params: Record<string, string> = {};
        route.paramNames.forEach((name, i) => {
            params[name] = decodeURIComponent(m[i + 1]);
        });
        return {route, params};
    }
    return null;
}
