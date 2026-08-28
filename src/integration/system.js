import { adapter } from "../adapters/index.js";

/**
 * System integration interface.
 * Delegates system-specific contracts directly to the unified system adapter layer.
 */
function getSpellLevel(config) {
    return adapter.getSpellLevel(config);
}

function getCreatureType(actor) {
    return adapter.getCreatureType(actor);
}

export const system = {
    getSpellLevel,
    getCreatureType
};