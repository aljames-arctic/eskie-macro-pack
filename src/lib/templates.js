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

    const gridSize = canvas?.grid?.size ?? canvas?.dimensions?.size ?? 100;
    const gridDistance = canvas?.grid?.distance ?? canvas?.scene?.grid?.distance ?? canvas?.dimensions?.distance ?? 5;

    const dir = template?.direction
        ?? template?.document?.direction
        ?? primary?.direction
        ?? config.direction
        ?? config.currentDirection
        ?? token?.document?.rotation
        ?? token?.rotation
        ?? 0;

    // Check if the placement is in attached/sticky mode or a directional shape (ray / cone)
    const isRayOrCone = (template?.t === 'ray' || template?.t === 'cone'
        || template?.document?.t === 'ray' || template?.document?.t === 'cone'
        || primary?.t === 'ray' || primary?.t === 'cone'
        || primary?.type === 'ray' || primary?.type === 'cone'
        || config?.type === 'ray' || config?.type === 'cone');

    const isAttached = Boolean(primary?.sticky || config?.sticky || config?.stickToToken || isRayOrCone);

    const dist = (template?.distance !== undefined && template.distance > 0)
        ? template.distance
        : ((template?.document?.distance !== undefined && template.document.distance > 0)
            ? template.document.distance
            : ((primary?.distance !== undefined && primary.distance > 0)
                ? primary.distance
                : (config.distance ?? (isAttached ? (config.max ?? 100) : 0))));

    const distPx = (dist / gridDistance) * gridSize;
    const rad = (dir * Math.PI) / 180;

    // If secondary is missing, resolve it
    if (!secondary) {
        if (isAttached || (distPx > 0 && template?.direction !== undefined)) {
            // In attached mode, primary is the token edge anchor point; project secondary to the far end
            secondary = {
                x: primary.x + Math.cos(rad) * distPx,
                y: primary.y + Math.sin(rad) * distPx
            };
        } else if (tokenCenter && Math.hypot(primary.x - tokenCenter.x, primary.y - tokenCenter.y) >= 1) {
            // Free/detached ground placement away from token
            secondary = primary;
            primary = { x: tokenCenter.x, y: tokenCenter.y };
        }
    }

    // Check if secondary collapses to the exact same coordinates as primary
    const isSamePoint = Boolean(secondary) && (Math.hypot(secondary.x - primary.x, secondary.y - primary.y) < 1);
    if (isSamePoint) {
        if (isAttached || distPx > 0) {
            // Primary remains the anchor/edge point; secondary extends out to the far end of the ray/template
            secondary = {
                x: primary.x + Math.cos(rad) * distPx,
                y: primary.y + Math.sin(rad) * distPx
            };
        } else if (tokenCenter && Math.hypot(primary.x - tokenCenter.x, primary.y - tokenCenter.y) >= 1) {
            secondary = primary;
            primary = { x: tokenCenter.x, y: tokenCenter.y };
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
    const isTemplateObject = Boolean(template && typeof template === 'object' && (template.x !== undefined || template.document !== undefined || template.shapes !== undefined || template.direction !== undefined));
    if (isTemplateObject) {
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