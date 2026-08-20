import 'reflect-metadata';

export const PREFIX_METADATA = 'controller:prefix';

export function Controller(prefix: string = '') {
    return function (target: any) {
        const normalized = ('/' + prefix).replace(/\/+/g, '/').replace(/\/$/, '');
        Reflect.defineMetadata(PREFIX_METADATA, normalized, target);
    };
}
