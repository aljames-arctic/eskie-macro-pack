import { log } from './logger.js';

/**
 * Gets position coordinates from a template document or crosshair.
 *
 * @param {Document|object} template The Foundry MeasuredTemplate or Region document
 * @param {object} [config={}] Configuration options
 * @returns {Promise<Array>} Coordinates array [primary, secondary]
 */
async function getPosition(template, config = {}) {

    let position;
    if (template) {
        let primary, secondary, center;

        // Foundry V14 Region structures
        if (template.documentName === 'Region' || template.shapes) {
            const shape = template.shapes?.[0];
            primary = { x: shape?.x ?? 0, y: shape?.y ?? 0 };
            center = { x: shape?.center?.x ?? 0, y: shape?.center?.y ?? 0 };

            // Calculate the furthest point based on shape rotation and radius
            const distance = shape?.radius ?? shape?.distance ?? 0;
            // Depending on the shape type, we find the farpoint along its rotation
            if (shape?.rotation !== undefined && distance > 0) {
                const rad = Math.toRadians(shape.rotation);
                secondary = {
                    x: primary.x + Math.cos(rad) * distance,
                    y: primary.y + Math.sin(rad) * distance
                };
            } else {
                // Fallback to origin if no direction is present (e.g. circles)
                secondary = { x: primary.x, y: primary.y };
            }
        } else {
            log.warn('getPosition: Falling back to legacy MeasuredTemplate support (pre-V14). This support will be removed in Foundry V16.');
            // Legacy MeasuredTemplate support
            const farpoint = template.object?.ray?.B;
            secondary = { x: farpoint?.x ?? template.x, y: farpoint?.y ?? template.y };
            primary = { x: template.x, y: template.y };
            const height = Math.sqrt(template.distance * template.distance - template.width * template.width);
            center = { x: template.x + (template.width / 2) * (canvas.grid.size / canvas.grid.distance), y: template.y + (height / 2) * (canvas.grid.size / canvas.grid.distance) };
        }

        return [primary, secondary, center];
    } else {
        position = await Sequencer.Crosshair.show();
        if (position?.cancelled) { return []; }
        return [position, undefined, position];
    }
}

export const template = {
    getPosition
};