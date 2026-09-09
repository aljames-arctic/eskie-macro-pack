import { BaseSystemAdapter } from './base-system-adapter.js';
import { Dnd5eSystemAdapter } from './dnd5e-system-adapter.js';
import { Pf2eSystemAdapter } from './pf2e-system-adapter.js';
import { GenericSystemAdapter } from './generic-system-adapter.js';
import { parseAndNormalizeAbility, BASE_ABILITY_MAP } from './helper.js';
import { BaseFoundryAdapter } from '../foundry/base-foundry-adapter.js';
import { log } from '../../lib/logger.js';

/**
 * Registry of known system adapters.
 * Maps system IDs to their corresponding adapter classes.
 */
export const SYSTEM_ADAPTERS: Record<string, new (foundryAdapter?: BaseFoundryAdapter | null) => BaseSystemAdapter> = {
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
export async function initializeSystemAdapter(systemId: string = game?.system?.id, foundryAdapter: BaseFoundryAdapter | null = null): Promise<BaseSystemAdapter> {
    if (foundryAdapter && !(foundryAdapter instanceof BaseFoundryAdapter)) {
        throw new Error(`initializeSystemAdapter requires a valid BaseFoundryAdapter instance, received: ${foundryAdapter}`);
    }
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

export { BaseSystemAdapter };
