import { log } from "./logger.js";

export function deprecation(newObj: any, oldPath: any, newPath: any, dateStr: any) {
    const wrapped: Record<string, any> = {};
    for (const [key, val] of Object.entries(newObj)) {
        if (typeof val === 'function') {
            wrapped[key] = async function (...args: any[]) {
                log.warn(`Deprecation Warning: '${oldPath}.${key}' is deprecated and will be removed on ${dateStr}. Please update your call to use '${newPath}.${key}' instead.`);
                return val(...args);
            };
        } else {
            wrapped[key] = val;
        }
    }
    return wrapped;
}

export const warn = {
    deprecation,
}