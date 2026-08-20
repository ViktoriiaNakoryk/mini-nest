import 'reflect-metadata';

export const PARAMS_METADATA = 'controller:params';

export type ParamType = 'body' | 'param' | 'query';

export interface ParamDefinition {
    type: ParamType;
    name?: string;
    schema?: any;
}

export type MethodParamsMap = Record<number, ParamDefinition>;

export type ClassParamsMap = Record<string, MethodParamsMap>;

function define(target: any, propertyKey: string, index: number, def: ParamDefinition) {
    const ctor = target.constructor;
    const all: ClassParamsMap = Reflect.getMetadata(PARAMS_METADATA, ctor) || {};
    const forMethod: MethodParamsMap = all[propertyKey] || {};
    forMethod[index] = def;
    all[propertyKey] = forMethod;
    Reflect.defineMetadata(PARAMS_METADATA, all, ctor);
}

export function Body(schema?: any) {
    return function (target: any, propertyKey: string, index: number) {
        define(target, propertyKey, index, {type: 'body', schema});
    };
}

export function Param(name?: string) {
    return function (target: any, propertyKey: string, index: number) {
        define(target, propertyKey, index, {type: 'param', name});
    };
}

export function Query(name?: string) {
    return function (target: any, propertyKey: string, index: number) {
        define(target, propertyKey, index, {type: 'query', name});
    };
}
