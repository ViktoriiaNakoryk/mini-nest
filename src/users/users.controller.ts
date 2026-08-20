import { Controller } from '../decorators/controller';
import { Get, Post } from '../decorators/methods';
import { Body, Param, Query } from '../decorators/params';
import { createUserSchema, CreateUserInput } from '../dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    // Сервіс приходить через конструктор — його створює контейнер (singleton).
    constructor(private readonly usersService: UsersService) {}

    @Get()
    list(@Query('limit') limit?: string) {
        const parsed = limit ? Number(limit) : undefined;
        return this.usersService.findAll(parsed);
    }

    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.usersService.findOne(Number(id));
    }

    @Post()
    create(@Body(createUserSchema) dto: CreateUserInput) {
        return this.usersService.create(dto);
    }
}
