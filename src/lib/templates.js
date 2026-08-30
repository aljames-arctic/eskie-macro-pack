import { adapter } from '../adapters/index.js';
import { log } from './logger.js';

/**
 * Validates and resolves position coordinates, ensuring primary and secondary
 * positions do not collapse to the same point (distance 0).
 *
 * @param {Array} positions Coordinates array [primary, secondary, center]
 * @param {object} [config={}] Configuration options (may include token, distance, direction)
 * @param {Document|object|null} [template=null] Original template or region document
 * @returns {Array} Resolved coordinates array or error array
 */
function resolveDistinctPositions(positions, config = {}, template = null) {
    if (!positions || positions.length === 0) return [];
    if (positions.error || positions[0]?.error) return positions;

    let [primary, secondary, center] = positions;
    if (!primary) return positions;

    const token = config.token ?? config.sourceToken;
    const tokenCenter = token?.center ?? (token?.x !== undefined ? { x: token.x, y: token.y } : null);

    // If secondary is missing, resolve relative to token if available
    if (!secondary) {
        if (tokenCenter && Math.hypot(primary.x - tokenCenter.x, primary.y - tokenCenter.y) >= 1) {
            secondary = primary;
            primary = { x: tokenCenter.x, y: tokenCenter.y };
        } else {
            const dir = template?.direction ?? template?.document?.direction ?? config.direction ?? token?.document?.rotation;
            const dist = (template?.distance !== undefined && template.distance > 0)
                ? template.distance
                : ((template?.document?.distance !== undefined && template.document.distance > 0) ? template.document.distance : (config.distance ?? config.max));
            if (dir !== undefined && dist !== undefined && dist > 0) {
                const gridSize = canvas?.grid?.size ?? canvas?.dimensions?.size ?? 100;
                const gridDistance = canvas?.grid?.distance ?? canvas?.scene?.grid?.distance ?? canvas?.dimensions?.distance ?? 5;
                const distPx = (dist / gridDistance) * gridSize;
                const rad = (dir * Math.PI) / 180;
                secondary = {
                    x: primary.x + Math.cos(rad) * distPx,
                    y: primary.y + Math.sin(rad) * distPx
                };
            }
        }
    }

    // Check if secondary collapses to the exact same coordinates as primary
    const isSamePoint = Boolean(secondary) && (Math.hypot(secondary.x - primary.x, secondary.y - primary.y) < 1);
    if (isSamePoint) {
        if (tokenCenter && Math.hypot(primary.x - tokenCenter.x, primary.y - tokenCenter.y) >= 1) {
            secondary = primary;
            primary = { x: tokenCenter.x, y: tokenCenter.y };
        } else {
            const gridSize = canvas?.grid?.size ?? canvas?.dimensions?.size ?? 100;
            const gridDistance = canvas?.grid?.distance ?? canvas?.scene?.grid?.distance ?? canvas?.dimensions?.distance ?? 5;
            const dir = template?.direction ?? template?.document?.direction ?? config.direction ?? token?.document?.rotation ?? 0;
            const dist = (template?.distance !== undefined && template.distance > 0)
                ? template.distance
                : ((template?.document?.distance !== undefined && template.document.distance > 0) ? template.document.distance : (config.distance ?? config.max ?? 100));
            const distPx = (dist / gridDistance) * gridSize;
            const rad = (dir * Math.PI) / 180;
            secondary = {
                x: primary.x + Math.cos(rad) * distPx,
                y: primary.y + Math.sin(rad) * distPx
            };
        }
    }

    // If after resolution secondary is still identical to primary, return an error
    if (secondary && (Math.hypot(secondary.x - primary.x, secondary.y - primary.y) < 1)) {
        log.error('templatelib.getPosition | Unable to resolve distinct non-zero positions for animation.', { template, config, primary, secondary });
        ui?.notifications?.error?.('Eskie Macro Pack | Unable to resolve coordinates for animation.');
        const err = new Error('Unable to resolve distinct coordinates for template animation');
        const errResult = [{ error: err, cancelled: true }, undefined, undefined];
        errResult.error = err;
        return errResult;
    }

    return [primary, secondary, center ?? primary];
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
    if (template) {
        positions = adapter.getTemplatePosition(template, config);
    } else {
        const position = await Sequencer?.Crosshair?.show?.(config);
        if (!position || position?.cancelled) {
            return [];
        }
        positions = [position, undefined, position];
    }

    return resolveDistinctPositions(positions, config, template);
}

export const template = {
    getPosition,
    resolveDistinctPositions
};