import { Injectable } from '../decorators/injectable';
import { CreateUserInput } from '../dto/create-user.dto';
import { AuditService } from '../services/audit.service';
import { NotFoundError } from '../errors';

@Injectable()
export class UsersService {
    // AuditService приходить через контейнер — той самий singleton.
    constructor(private readonly audit: AuditService) {}

    private users = [
        { id: 1, name: 'Ada' },
        { id: 2, name: 'Grace' },
    ];

    findAll(limit?: number) {
        return limit ? this.users.slice(0, limit) : this.users;
    }

    findOne(id: number) {
        // Другий рівень: сервіс іде ще глибше в AuditService, який читає
        // requestId зі сховища — параметром id сюди не передається.
        const requestId = this.audit.record(`findOne(${id})`);
        const user = this.users.find((u) => u.id === id);
        if (!user) {
            throw new NotFoundError(`User ${id} not found`);
        }
        return { ...user, requestId };
    }

    create(dto: CreateUserInput) {
        this.audit.record(`create(${dto.email})`);
        const user = { id: this.users.length + 1, ...dto };
        this.users.push({ id: user.id, name: dto.name });
        return user;
    }
}
