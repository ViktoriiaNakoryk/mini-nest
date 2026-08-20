import 'reflect-metadata';
import { Container } from './container';
import { createApp } from './dispatcher';
import { UsersController } from './users/users.controller';

const PORT = Number(process.env.PORT) || 3000;

const container = new Container();
const app = createApp({ controllers: [UsersController], container });

app.listen(PORT, () => {
    console.log(`mini-nest слухає http://localhost:${PORT}`);
    console.log('Спробуйте:');
    console.log(`  curl http://localhost:${PORT}/users`);
    console.log(`  curl http://localhost:${PORT}/users/42`);
    console.log(`  curl "http://localhost:${PORT}/users?limit=1"`);
    console.log(`  curl -X POST http://localhost:${PORT}/users -H 'Content-Type: application/json' -d '{"email":"ada@example.com","name":"Ada"}'`);
});
