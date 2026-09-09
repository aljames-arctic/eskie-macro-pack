import { adapter } from '../../adapters/index.js';

/**
 * Finds the adjacent grid center point with the minimal perpendicular distance
 * to the line between two tokens.
 * 
 * @param {Token} token - The reference token (usually the caster).
 * @param {Token} target - The target token.
 * @returns {object} The center point {x, y} of the best adjacent grid cell.
 */
export function getBestAdjacentLocation(token: any, target: any) {
    return adapter.getBestAdjacentLocation(token, target);
}

export const grid = {
    getBestAdjacentLocation,
};

