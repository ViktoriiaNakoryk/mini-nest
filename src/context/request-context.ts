import {AsyncLocalStorage} from 'node:async_hooks';
import {randomUUID} from 'node:crypto';

export interface RequestStore {
    requestId: string;
}

const als = new AsyncLocalStorage<RequestStore>();

export function runWithContext<T>(store: RequestStore, callback: () => T): T {
    return als.run(store, callback);
}

export function getRequestId(): string | undefined {
    return als.getStore()?.requestId;
}

export function resolveRequestId(headerValue?: string | string[]): string {
    if (typeof headerValue === 'string' && headerValue.trim()) {
        return headerValue.trim();
    }
    if (Array.isArray(headerValue) && headerValue[0]) {
        return headerValue[0];
    }
    return randomUUID();
}
