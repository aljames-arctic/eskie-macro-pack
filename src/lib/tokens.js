import { adapter } from '../adapters/index.js';

/**
 * Finds the center of the grid square on a target token that is nearest to a source token.
 * Delegates geometric resolution directly to the active Foundry adapter.
 * @param {Token} token - The source token.
 * @param {Token} target - The target token.
 * @returns {{x: number, y: number}|null} The coordinates of the center of the nearest square.
 */
function getNearestSquareCenter(token, target) {
    return adapter.getNearestSquareCenter(token, target);
}

/**
 * Returns an array of users who are owners of a given token.
 * Evaluates document ownership permissions via the unified adapter.
 * @param {Token} token - The token to check for owners.
 * @param {object} [config={}] - Optional configuration.
 * @param {boolean} [config.applyPC=true] - Whether to include player characters.
 * @param {boolean} [config.applyGM=true] - Whether to include Game Masters.
 * @returns {User[]} An array of User objects who are owners of the token.
 */
function owners(token, config = {}) {
    if (!token) return [];
    const applyPC = config.applyPC !== false;
    const applyGM = config.applyGM !== false;
    const doc = token.document ?? token;
    const actor = token.actor ?? doc?.actor ?? null;

    const usersCollection = globalThis.game?.users;
    const allUsers = usersCollection?.contents
        ?? (usersCollection?.values ? Array.from(usersCollection.values()) : null)
        ?? (usersCollection ? Array.from(usersCollection) : []);

    let matched = allUsers.filter(user => adapter.isUserDocumentOwner(user, actor, doc));
    if (!applyPC) matched = matched.filter(user => Boolean(user.isGM));
    if (!applyGM) matched = matched.filter(user => !user.isGM);
    return matched;
}

/**
 * Calculates the 3D distance between two tokens in scene units (e.g., feet/meters), rounded up.
 * Delegates distance calculation directly to the active Foundry adapter.
 * @param {Token} t1 - The first token.
 * @param {Token} t2 - The second token.
 * @returns {number} The 3D distance in scene units, rounded up.
 */
function getDistance(t1, t2) {
    return adapter.getDistance(t1, t2);
}

export const tokens = {
    owners,
    getNearestSquareCenter,
    getDistance
};