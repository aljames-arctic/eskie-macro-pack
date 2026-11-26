import { adapter } from '../../adapters/index.js';

const MOTION_DOCUMENT_NAMES = new Set(['Token', 'Tile', 'Drawing']);

/**
 * Checks whether a candidate is a concrete Foundry placeable supported by Sequencer's `.motion()` API
 * (`Token`, `Tile`, or `Drawing`), explicitly excluding synthetic trap proxies and `Region` objects.
 *
 * @param {unknown} target Candidate target placeable or document
 * @returns {boolean} True if safe to pass to `sequence.motion(target)`
 */
export function isMotionPlaceable(target: unknown): target is Token | Tile {
    if (!target) return false;
    const candidate = target as Record<string, any>;
    if (Boolean(candidate.isTrapCasterProxy || candidate.isTrapTargetProxy || candidate.isRegionOrigin)) {
        return false;
    }
    if (Boolean(candidate.shapes || candidate.document?.shapes)) {
        return false;
    }
    const docName = adapter.getDocumentName(candidate);
    if (docName) {
        return MOTION_DOCUMENT_NAMES.has(docName);
    }
    return Boolean(candidate.mesh || candidate.shape);
}

/**
 * Normalizes a placeable or document input at API entry boundaries into a concrete motion-compatible
 * canvas placeable (`Token`, `Tile`, or `Drawing`), returning `null` for Regions, trap proxies, or invalid targets.
 *
 * @param {unknown} target Input placeable, document, or proxy
 * @returns {Token | Tile | null} Resolved canvas placeable or `null`
 */
export function resolveMotionTarget(target: unknown): Token | Tile | null {
    if (!target) return null;
    const raw = target as Record<string, any>;
    const candidate = raw.object ?? raw;
    return isMotionPlaceable(candidate) ? (candidate as Token | Tile) : null;
}

/**
 * Ends both persistent Sequencer effects and persistent Sequencer motions for a given target and effect name.
 *
 * @param {unknown} target Target placeable or document
 * @param {string} name Registered `.name()` label shared by the effect and motion sections
 * @param {{ settle?: number }} [options] Optional return-leg settle duration override (ms) for `MotionManager.endMotions`
 * @returns {Promise<void>}
 */
export async function endEffectsAndMotions(
    target: unknown,
    name: string,
    options?: { settle?: number }
): Promise<void> {
    const motionTarget = resolveMotionTarget(target);
    if (motionTarget) {
        const endOptions = options?.settle !== undefined
            ? { name, settle: options.settle }
            : { name };
        Sequencer.MotionManager.endMotions(motionTarget, endOptions);
    }
    await Sequencer.EffectManager.endEffects({ name, object: target });
}

/**
 * Computes the pixel delta from a placeable's current center to a destination center coordinate.
 * Prefer passing this delta to `.motion(target).moveBy(...)` rather than passing a center coordinate
 * to `.moveTo(...)`, because Sequencer `.moveTo({ x, y })` interprets literal points as top-left coordinates.
 *
 * @param {Token | Tile | CasterProxy | TargetProxy} fromTarget Origin placeable
 * @param {{ x: number; y: number }} toCenter Destination center coordinate in canvas pixels
 * @returns {{ x: number; y: number }} Relative `{ x, y }` pixel offset
 */
export function computeCenterDelta(
    fromTarget: Token | Tile | CasterProxy | TargetProxy,
    toCenter: { x: number; y: number }
): { x: number; y: number } {
    const start = adapter.getCenter(fromTarget);
    if (!start) return { x: 0, y: 0 };
    return {
        x: toCenter.x - start.x,
        y: toCenter.y - start.y,
    };
}

export const motion = {
    isMotionPlaceable,
    resolveMotionTarget,
    endEffectsAndMotions,
    computeCenterDelta,
};
