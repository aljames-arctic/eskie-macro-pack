import { BaseFoundryAdapter } from './base-foundry-adapter.js';
import { FoundryV12Adapter } from './foundry-v12-adapter.js';
import { FoundryV13Adapter } from './foundry-v13-adapter.js';
import { FoundryV14Adapter } from './foundry-v14-adapter.js';
import { log } from '../../lib/logger.js';

export { BaseFoundryAdapter };

/**
 * Initialize and return the active Foundry VTT platform adapter.
 * Selects FoundryV14Adapter for v14+, FoundryV13Adapter for v13, and FoundryV12Adapter for v12 baseline.
 * @param {object|null} [parentAdapter=null] Parent Unified Adapter reference
 * @returns {FoundryV14Adapter|FoundryV13Adapter|FoundryV12Adapter}
 */
export function initializeFoundryAdapter(parentAdapter: any = null): BaseFoundryAdapter {
    let generation = 12;
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
        : (generation === 13
            ? new FoundryV13Adapter(parentAdapter)
            : new FoundryV12Adapter(parentAdapter));
    log.info(`Initialized Foundry Platform Adapter (v${adapter.generation})`);
    return adapter;
}
