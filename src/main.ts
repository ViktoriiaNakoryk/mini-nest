import 'reflect-metadata';
import {Container} from './container';
import {createApp} from './dispatcher';
import {UsersController} from './users/users.controller';
import {AuthGuard} from './guards/auth.guard';
import {LoggingInterceptor} from './interceptors/logging.interceptor';
import {ZodValidationPipe} from './pipes/zod-validation.pipe';
import {DefaultExceptionFilter} from './filters/exception.filter';
import {getRequestId} from './context/request-context';

const PORT = Number(process.env.PORT) || 3000;

const container = new Container();

const app = createApp({
    controllers: [UsersController],
    container,
    middleware: [
        (ctx) => {
            console.log(`[req ${getRequestId()}] ${ctx.method} ${ctx.path}`);
        },
    ],
    guards: [new AuthGuard()],
    interceptors: [new LoggingInterceptor()],
    pipes: [new ZodValidationPipe()],
    filters: [new DefaultExceptionFilter()],
});

app.listen(PORT, () => {
    console.log(`mini-nest слухає http://localhost:${PORT}`);
    console.log('Спробуйте (потрібен заголовок Authorization через AuthGuard):');
    console.log(`  curl -si -H 'Authorization: token' http://localhost:${PORT}/users/1 | grep -i x-request-id`);
    console.log(`  curl -s http://localhost:${PORT}/users/1   # 403 без Authorization`);
});
