import { shatterMask } from './shatter-mask.js';
import { burnMask } from './burn-mask.js';
import { tearMask } from './tear-mask.js';
import { smokeMask } from './smoke-mask.js';
import { saoDeath } from './sao-death.js';

console.warn('Initializing mask export');

export const mask = {
    shatter: shatterMask,
    burn: burnMask,
    tear: tearMask,
    smoke: smokeMask,
    saoDeath
};
