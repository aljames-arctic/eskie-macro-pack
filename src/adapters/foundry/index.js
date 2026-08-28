import { BaseFoundryAdapter, USER_PERMISSION_TIERS } from './base-foundry-adapter.js';
import { FoundryCurrentAdapter } from './foundry-current-adapter.js';
import { log } from '../../lib/logger.js';

export { BaseFoundryAdapter, FoundryCurrentAdapter, USER_PERMISSION_TIERS };

/**
 * Initialize and return the active Foundry VTT platform adapter.
 * Uses FoundryCurrentAdapter on modern Foundry releases (v14+) and BaseFoundryAdapter on legacy baseline (v12/v13).
 * @param {object|null} [parentAdapter=null] Parent Unified Adapter reference
 * @returns {FoundryCurrentAdapter|BaseFoundryAdapter}
 */
export function initializeFoundryAdapter(parentAdapter = null) {
    let generation = 12;
    if (typeof game !== 'undefined') {
        if (game.release?.generation !== undefined) {
            generation = game.release.generation;
        } else if (game.version) {
            const major = parseInt(String(game.version).split('.')[0], 10);
            if (!Number.isNaN(major)) generation = major;
        }
    }

    const adapter = generation >= 14 ? new FoundryCurrentAdapter(parentAdapter) : new BaseFoundryAdapter(parentAdapter);
    log.info(`Initialized Foundry Platform Adapter (v${adapter.generation})`);
    return adapter;
}
