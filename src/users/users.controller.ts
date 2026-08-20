import {Controller} from '../decorators/controller';
import {Get, Post} from '../decorators/methods';
import {Body, Param, Query} from '../decorators/params';
import {CreateUserDto} from '../dto/create-user.dto';
import {UsersService} from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {
    }

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
    create(@Body() dto: CreateUserDto) {
        return {
            created: this.usersService.create(dto),
            isDto: dto instanceof CreateUserDto,
        };
    }
}
