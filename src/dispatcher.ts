import 'reflect-metadata';
import http from 'node:http';
import {Container} from './container';
import {buildRoutes, matchRoute, Route} from './router';
import {ParamDefinition} from './decorators/params';
import {
    ExecutionContext,
    Middleware,
    Guard,
    Interceptor,
    Pipe,
    ExceptionFilter,
} from './lifecycle/types';
import {DefaultExceptionFilter} from './filters/exception.filter';
import {NotFoundError, ForbiddenError} from './errors';
import {runWithContext, resolveRequestId} from './context/request-context';

function readBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf-8');
            if (!raw) return resolve({});
            try {
                resolve(JSON.parse(raw));
            } catch {
                reject(new Error('Invalid JSON body'));
            }
        });
        req.on('error', reject);
    });
}

async function buildArgs(
    route: Route,
    ctx: ExecutionContext,
    pipes: Pipe[],
): Promise<any[]> {
    const indexes = Object.keys(route.paramsMap).map(Number);
    const maxIndex = indexes.length ? Math.max(...indexes) : -1;
    const args: any[] = new Array(maxIndex + 1).fill(undefined);

    for (const index of indexes) {
        const def: ParamDefinition = route.paramsMap[index];
        let value: any;
        switch (def.type) {
            case 'body':
                value = ctx.body;
                break;
            case 'param':
                value = def.name ? ctx.params[def.name] : ctx.params;
                break;
            case 'query':
                value = def.name ? ctx.query.get(def.name) : Object.fromEntries(ctx.query);
                break;
        }

        for (const pipe of pipes) {
            value = await pipe.transform(value, {
                type: def.type,
                name: def.name,
                schema: def.schema,
                index,
            });
        }
        args[index] = value;
    }

    return args;
}

function runInterceptors(
    interceptors: Interceptor[],
    ctx: ExecutionContext,
    handler: () => Promise<any>,
): Promise<any> {
    const dispatch = (i: number): Promise<any> => {
        if (i === interceptors.length) return handler();
        return interceptors[i].intercept(ctx, () => dispatch(i + 1));
    };
    return dispatch(0);
}

function sendJson(res: http.ServerResponse, status: number, payload: any): void {
    const json = JSON.stringify(payload);
    res.writeHead(status, {'Content-Type': 'application/json'});
    res.end(json);
}

export interface CreateAppOptions {
    controllers: any[];
    container: Container;
    middleware?: Middleware[];
    guards?: Guard[];
    interceptors?: Interceptor[];
    pipes?: Pipe[];
    filters?: ExceptionFilter[];
}

export function createApp(options: CreateAppOptions): http.Server {
    const {controllers, container} = options;
    const middleware = options.middleware ?? [];
    const guards = options.guards ?? [];
    const interceptors = options.interceptors ?? [];
    const pipes = options.pipes ?? [];
    const filters = options.filters ?? [new DefaultExceptionFilter()];

    const table = buildRoutes(controllers);

    return http.createServer((req, res) => {
        const requestId = resolveRequestId(req.headers['x-request-id']);
        res.setHeader('X-Request-Id', requestId);

        runWithContext({requestId}, async () => {
            let ctx: ExecutionContext | undefined;
            try {
                const url = new URL(req.url || '/', 'http://localhost');
                const method = req.method || 'GET';
                const matched = matchRoute(table, method, url.pathname);
                if (!matched) {
                    throw new NotFoundError(`Cannot ${method} ${url.pathname}`);
                }

                const hasBody = method === 'POST' || method === 'PUT' || method === 'PATCH';
                const body = hasBody ? await readBody(req) : {};

                ctx = {
                    req,
                    res,
                    method,
                    path: url.pathname,
                    requestId,
                    route: matched.route,
                    params: matched.params,
                    query: url.searchParams,
                    body,
                };

                for (const mw of middleware) {
                    await mw(ctx);
                }

                for (const guard of guards) {
                    const ok = await guard.canActivate(ctx);
                    if (!ok) {
                        throw new ForbiddenError();
                    }
                }

                const result = await runInterceptors(interceptors, ctx, async () => {
                    const args = await buildArgs(matched.route, ctx!, pipes);
                    const controller = container.resolve(matched.route.controllerClass);
                    return controller[matched.route.handlerName](...args);
                });

                const status = matched.route.method === 'POST' ? 201 : 200;
                sendJson(res, status, result ?? null);
            } catch (err) {
                let handled: { status: number; body: any } | null = null;
                for (const filter of filters) {
                    handled = filter.catch(err);
                    if (handled) break;
                }
                const fallback = {status: 500, body: {statusCode: 500, message: 'Internal Server Error'}};
                const {status, body} = handled ?? fallback;
                sendJson(res, status, body);
            }
        });
    });
}
