import { Injectable } from '../decorators/injectable';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class UsersService {
    private users = [
        { id: 1, name: 'Ada' },
        { id: 2, name: 'Grace' },
    ];

    findAll(limit?: number) {
        return limit ? this.users.slice(0, limit) : this.users;
    }

    findOne(id: number) {
        return this.users.find((u) => u.id === id) ?? { id, name: 'unknown' };
    }

    create(dto: CreateUserDto) {
        const user = { id: this.users.length + 1, ...dto };
        this.users.push({ id: user.id, name: dto.name });
        return user;
    }
}
