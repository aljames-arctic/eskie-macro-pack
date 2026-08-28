import { adapter } from '../../adapters/index.js';

function getSpellLevel(config = {}) {
    return adapter.getSpellLevel(config);
}

export const dnd5e = {
    getSpellLevel,
};