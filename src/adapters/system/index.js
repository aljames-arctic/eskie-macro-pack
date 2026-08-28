import { BaseSystemAdapter } from './base-system-adapter.js';
import { Dnd5eSystemAdapter } from './dnd5e-system-adapter.js';
import { Pf2eSystemAdapter } from './pf2e-system-adapter.js';
import { GenericSystemAdapter } from './generic-system-adapter.js';
import { parseAndNormalizeAbility, BASE_ABILITY_MAP } from './helper.js';
import { log } from '../../lib/logger.js';

/**
 * Registry of known system adapters.
 * Maps system IDs to their corresponding adapter classes.
 */
export const SYSTEM_ADAPTERS = {
    'dnd5e': Dnd5eSystemAdapter,
    'pf2e': Pf2eSystemAdapter,
    'generic': GenericSystemAdapter
};

/**
 * Loads and instantiates the active system adapter.
 * For unsupported systems, falls back immediately to GenericSystemAdapter.
 * @param {string} [systemId]
 * @param {BaseFoundryAdapter} [foundryAdapter=null]
 * @returns {Promise<BaseSystemAdapter>}
 */
export async function initializeSystemAdapter(systemId = globalThis.game?.system?.id, foundryAdapter = null) {
    if (!systemId) {
        return new GenericSystemAdapter(foundryAdapter);
    }

    const AdapterClass = SYSTEM_ADAPTERS[systemId];
    if (AdapterClass) {
        log.info(`Initialized system adapter for: ${systemId}`);
        return new AdapterClass(foundryAdapter);
    }

    log.warn(`System "${systemId}" is not currently supported with a dedicated adapter, falling back to GenericSystemAdapter.`);
    return new GenericSystemAdapter(foundryAdapter);
}

export {
    BaseSystemAdapter,
    Dnd5eSystemAdapter,
    Pf2eSystemAdapter,
    GenericSystemAdapter,
    parseAndNormalizeAbility,
    BASE_ABILITY_MAP
};
