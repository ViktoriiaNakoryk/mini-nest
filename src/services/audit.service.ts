import {Injectable} from '../decorators/injectable';
import {getRequestId} from '../context/request-context';

@Injectable()
export class AuditService {
    record(action: string): string | undefined {
        const requestId = getRequestId();
        console.log(`[audit ${requestId ?? 'no-context'}] ${action}`);
        return requestId;
    }
}
