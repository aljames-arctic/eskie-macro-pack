import { BaseFoundryAdapter } from './base-foundry-adapter.js';
import { FoundryV13Adapter } from './foundry-v13-adapter.js';
import { FoundryV14Adapter } from './foundry-v14-adapter.js';
import { log } from '../../lib/logger.js';

export { BaseFoundryAdapter };

/**
 * Initialize and return the active Foundry VTT platform adapter.
 * Selects FoundryV14Adapter for v14+ and FoundryV13Adapter for the v13 baseline.
 * @param {object|null} [parentAdapter=null] Parent Unified Adapter reference
 * @returns {FoundryV14Adapter|FoundryV13Adapter}
 */
export function initializeFoundryAdapter(parentAdapter: any = null): BaseFoundryAdapter {
    let generation = 13;
    if (typeof game !== 'undefined') {
        if (game.release?.generation !== undefined) {
            generation = game.release.generation;
        } else if (game.version) {
            const major = parseInt(String(game.version).split('.')[0], 10);
            if (!Number.isNaN(major)) generation = major;
        }
    }

    const adapter = generation >= 14
        ? new FoundryV14Adapter(parentAdapter)
        : new FoundryV13Adapter(parentAdapter);
    log.info(`Initialized Foundry Platform Adapter (v${adapter.generation})`);
    return adapter;
}
