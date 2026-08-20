import http from 'node:http';
import {Route} from '../router';
import {ParamType} from '../decorators/params';

export interface ExecutionContext {
    req: http.IncomingMessage;
    res: http.ServerResponse;
    method: string;
    path: string;
    requestId: string;
    route: Route;
    params: Record<string, string>;
    query: URLSearchParams;
    body: any;
}

export type Middleware = (ctx: ExecutionContext) => void | Promise<void>;

export interface Guard {
    canActivate(ctx: ExecutionContext): boolean | Promise<boolean>;
}

export interface Interceptor {
    intercept(ctx: ExecutionContext, next: () => Promise<any>): Promise<any>;
}

export interface PipeMeta {
    type: ParamType;
    name?: string;
    schema?: any;
    index: number;
}

export interface Pipe {
    transform(value: any, meta: PipeMeta): any | Promise<any>;
}

export interface ExceptionFilter {
    catch(err: unknown): { status: number; body: any } | null;
}
