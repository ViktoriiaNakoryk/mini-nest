# mini-nest

Навчальний IoC-контейнер: читає метадані типів із конструктора й сам збирає граф залежностей — те саме, що NestJS робить під капотом.

## Як запустити

Встановлення:

```bash
npm install
```

Тести локально:

```bash
npm test
```

Тести в Docker:

```bash
docker compose run --rm api npm test
```

## Як це працює

Коли клас позначений декоратором `@Injectable()`, а в `tsconfig.json` увімкнена опція `emitDecoratorMetadata`, TypeScript під час компіляції автоматично записує типи параметрів конструктора в метадані класу під ключ `design:paramtypes`. `Container.resolve()` дістає цей масив типів через `Reflect.getMetadata('design:paramtypes', Target)` і для кожного типу з масиву рекурсивно викликає `resolve()` знову, і будується весь ланцюжок залежностей, від кореневого класу до найглибшого.

Якщо прапорець `emitDecoratorMetadata` вимкнений, TypeScript узагалі не генерує цих метаданих під час компіляції: виклик `Reflect.getMetadata('design:paramtypes', Target)` поверне `undefined`, і контейнеру нема звідки брати список залежностей.
