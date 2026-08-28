import { adapter } from '../adapters/index.js';

/**
 * Finds the center of the grid square on a target token that is nearest to a source token.
 * @param {Token} token - The source token.
 * @param {Token} target - The target token.
 * @returns {{x: number, y: number}} The coordinates of the center of the nearest square.
 */
function getNearestSquareCenter(token, target) {
    const gs = globalThis.canvas?.grid?.size ?? 100;
    const srcCenter = token.center ?? { x: token.x ?? 0, y: token.y ?? 0 };

    const w = target.document?.width ?? target.width ?? 1;
    const h = target.document?.height ?? target.height ?? 1;

    let bestPoint = null;
    let bestDist2 = Infinity;

    for (let gx = 0; gx < w; gx++) {
        for (let gy = 0; gy < h; gy++) {
            const cx = (target.x ?? 0) + (gx + 0.5) * gs;
            const cy = (target.y ?? 0) + (gy + 0.5) * gs;

            const dx = cx - srcCenter.x;
            const dy = cy - srcCenter.y;
            const d2 = dx * dx + dy * dy;

            if (d2 < bestDist2) {
                bestDist2 = d2;
                bestPoint = { x: cx, y: cy };
            }
        }
    }

    return bestPoint;
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
 * Calculates the 3D distance between two tokens in scene units (e.g., feet), rounded up.
 * @param {Token} t1 - The first token.
 * @param {Token} t2 - The second token.
 * @returns {number} The 3D distance in scene units, rounded up.
 */
function getDistance(t1, t2) {
    const p1 = t1.center ?? { x: t1.x ?? 0, y: t1.y ?? 0 };
    const p2 = t2.center ?? { x: t2.x ?? 0, y: t2.y ?? 0 };
    const dist2DPx = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    
    // Convert 2D pixel distance to scene units (e.g., feet/meters)
    const gridSize = globalThis.canvas?.grid?.size ?? 100;
    const gridDistance = globalThis.canvas?.scene?.grid?.distance ?? globalThis.canvas?.grid?.distance ?? 5;
    const dist2DUnits = (dist2DPx / gridSize) * gridDistance;
    
    // Get elevation difference (already in scene units)
    const el1 = t1.document?.elevation ?? 0;
    const el2 = t2.document?.elevation ?? 0;
    const elDiff = el1 - el2;
    
    // 3D Euclidean distance in scene units, rounded up
    const dist3DUnits = Math.hypot(dist2DUnits, elDiff);
    return Math.ceil(dist3DUnits);
}

export const tokens = {
    owners,
    getNearestSquareCenter,
    getDistance
};