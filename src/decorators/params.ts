import 'reflect-metadata';

export const PARAMS_METADATA = 'controller:params';

export type ParamType = 'body' | 'param' | 'query';

export interface ParamDefinition {
    type: ParamType;
    name?: string;
}

export type MethodParamsMap = Record<number, ParamDefinition>;

export type ClassParamsMap = Record<string, MethodParamsMap>;

function createParamDecorator(type: ParamType) {
    return function (name?: string) {
        return function (target: any, propertyKey: string, parameterIndex: number) {
            const ctor = target.constructor;
            const all: ClassParamsMap =
                Reflect.getMetadata(PARAMS_METADATA, ctor) || {};

            const forMethod: MethodParamsMap = all[propertyKey] || {};
            forMethod[parameterIndex] = {type, name};

            all[propertyKey] = forMethod;
            Reflect.defineMetadata(PARAMS_METADATA, all, ctor);
        };
    };
}

export const Body = createParamDecorator('body');
export const Param = createParamDecorator('param');
export const Query = createParamDecorator('query');
