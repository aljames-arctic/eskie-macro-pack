import { adapter } from '../adapters/index.js';

/**
 * Gets position coordinates from a template document or crosshair.
 * Delegates geometric resolution directly to the active Foundry adapter.
 *
 * @param {Document|object|null} template The Foundry MeasuredTemplate or Region document
 * @param {object} [config={}] Configuration options
 * @returns {Promise<Array>} Coordinates array [primary, secondary, center]
 */
async function getPosition(template, config = {}) {
    if (template) {
        return adapter.getTemplatePosition(template, config);
    }

    const position = await globalThis.Sequencer?.Crosshair?.show?.();
    if (position?.cancelled) {
        return [];
    }
    return [position, undefined, position];
}

export const template = {
    getPosition
};