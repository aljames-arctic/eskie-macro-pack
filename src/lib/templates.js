import { adapter } from '../adapters/index.js';
import { log } from './logger.js';

/**
 * Validates that primary and secondary coordinates are distinct (distance >= 1px).
 * Delegates to active Foundry adapter.
 *
 * @param {Array} positions Coordinates array [primary, secondary, center]
 * @param {object} [config={}] Configuration options
 * @param {Document|object|null} [template=null] Original template or region document
 * @returns {Array} Resolved coordinates array or error array
 */
function resolveDistinctPositions(positions, config = {}, template = null) {
    return adapter.resolveDistinctPositions(positions, config, template);
}

/**
 * Gets position coordinates from a template document or crosshair.
 * Delegates geometric resolution directly to the active Foundry adapter.
 *
 * @param {Document|object|null} template The Foundry MeasuredTemplate or Region document
 * @param {object} [config={}] Configuration options
 * @returns {Promise<Array>} Coordinates array [primary, secondary, center]
 */
async function getPosition(template, config = {}) {
    let positions;
    const isTemplateObject = Boolean(template && typeof template === 'object' && (template.x !== undefined || template.document !== undefined || template.shapes !== undefined || template.direction !== undefined));

    if (isTemplateObject) {
        positions = adapter.getTemplatePosition(template, config);
    } else {
        const position = await Sequencer?.Crosshair?.show?.(config);
        if (!position || position?.cancelled) {
            return [];
        }
        positions = adapter.getCrosshairPosition(position, config);
    }

    if (!positions || positions.length === 0 || positions[0]?.error) {
        return positions;
    }

    const [primary, secondary, center] = positions;
    const token = config.token ?? config.sourceToken;
    const tokenCenter = token?.center ?? (token?.x !== undefined ? { x: token.x, y: token.y } : null);
    const distancePx = secondary ? Math.hypot(secondary.x - primary.x, secondary.y - primary.y) : 0;

    log.debug('templatelib.getPosition | Coordinates resolved:', {
        source: tokenCenter ? { ...tokenCenter, name: token?.document?.name ?? token?.name } : null,
        primary,
        secondary,
        center: center ?? primary,
        distancePx,
        template: template ? {
            x: template.x ?? template.document?.x,
            y: template.y ?? template.document?.y,
            direction: template.direction ?? template.document?.direction,
            distance: template.distance ?? template.document?.distance,
            type: template.t ?? template.document?.t ?? template.documentName
        } : null
    });

    return positions;
}

export const template = {
    getPosition,
    resolveDistinctPositions
};