import 'reflect-metadata';
import http from 'node:http';
import {Container} from './container';
import {buildRoutes, matchRoute, Route} from './router';
import {ParamDefinition} from './decorators/params';
import {validationPipe, ValidationException} from './pipes/validation.pipe';

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
    body: any,
    pathParams: Record<string, string>,
    query: URLSearchParams,
): Promise<any[]> {
    const indexes = Object.keys(route.paramsMap).map(Number);
    const maxIndex = indexes.length ? Math.max(...indexes) : -1;
    const args: any[] = new Array(maxIndex + 1).fill(undefined);

    for (const index of indexes) {
        const def: ParamDefinition = route.paramsMap[index];
        switch (def.type) {
            case 'body':
                args[index] = await validationPipe(body, route.paramTypes[index]);
                break;
            case 'param':
                args[index] = def.name ? pathParams[def.name] : pathParams;
                break;
            case 'query':
                args[index] = def.name ? query.get(def.name) : Object.fromEntries(query);
                break;
        }
    }

    return args;
}

function sendJson(res: http.ServerResponse, status: number, payload: any): void {
    const json = JSON.stringify(payload);
    res.writeHead(status, {'Content-Type': 'application/json'});
    res.end(json);
}

export interface CreateAppOptions {
    controllers: any[];
    container: Container;
}

/**
 * Створює http.Server, який на кожен запит:
 * 1) знаходить маршрут у таблиці (немає → 404);
 * 2) парсить тіло; 3) збирає args за paramsMap;
 * 4) бере інстанс контролера з контейнера (singleton, не new вручну);
 * 5) викликає метод, серіалізує результат у JSON.
 */
export function createApp(options: CreateAppOptions): http.Server {
    const {controllers, container} = options;
    const table = buildRoutes(controllers);

    return http.createServer(async (req, res) => {
        try {
            const url = new URL(req.url || '/', 'http://localhost');
            const matched = matchRoute(table, req.method || 'GET', url.pathname);

            if (!matched) {
                return sendJson(res, 404, {statusCode: 404, message: 'Not Found'});
            }

            const {route, params} = matched;
            const hasBody = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH';
            const body = hasBody ? await readBody(req) : {};

            const args = await buildArgs(route, body, params, url.searchParams);

            // Контролер тягнемо з контейнера частини 1 → той самий singleton.
            const controller = container.resolve(route.controllerClass);
            const result = await controller[route.handlerName](...args);

            const status = route.method === 'POST' ? 201 : 200;
            sendJson(res, status, result ?? null);
        } catch (err) {
            if (err instanceof ValidationException) {
                return sendJson(res, 400, {
                    statusCode: 400,
                    message: 'Validation failed',
                    errors: err.errors,
                });
            }
            sendJson(res, 500, {
                statusCode: 500,
                message: err instanceof Error ? err.message : 'Internal Server Error',
            });
        }
    });
}
