import { dependency } from './dependency.js';
import { log } from './logger.js';
import { adapter } from '../adapters/index.js';

const BBC_DEPENDENCY = { id: 'bakana-better-crosshairs', ref: "Bakana's Better Crosshairs" };

/**
 * Ensures Bakana's Better Crosshairs (BBC) is active and returns its API.
 *
 * @returns {object} The BBC API object.
 * @throws {Error} If BBC module or crosshair API is uninitialized.
 */
function getBbcApi() {
    dependency.required([BBC_DEPENDENCY]);
    const bbc = game.modules?.get('bakana-better-crosshairs');
    const api = bbc?.api?.adapter ?? bbc?.api;
    if (!api?.crosshair) {
        const errorMsg = "Bakana's Better Crosshairs (BBC) API is not initialized.";
        log.error(errorMsg);
        throw new Error(errorMsg);
    }
    return api;
}

/**
 * Delegates a specific shape crosshair play invocation to BBC.
 *
 * @param {string} shape The shape name ('cone', 'circle', 'ray', 'square')
 * @param {object|null} [placeable=null] The canvas MeasuredTemplate or Region placeable (or null)
 * @param {object} [config={}] Shape configuration options
 * @returns {Promise<unknown>} The BBC play sequence result
 */
async function playShape(shape: string, placeable: any = null, config: any = {}) {
    const api = getBbcApi();
    log.debug(`Delegating crosshair "${shape}" play to BBC API:`, placeable?.id ?? config.token?.name);
    const shapeBuilder = api.crosshair?.[shape] ?? api.crosshair?.circle;
    if (shapeBuilder?.play) {
        return shapeBuilder.play(placeable, config);
    }
    return api.crosshair.play(shape, placeable, config);
}

export const crosshair = {
    cone: {
        play: (placeable: any = null, config: any = {}) => playShape('cone', placeable, config),
        create: (placeable: any = null, config: any = {}) => getBbcApi().crosshair?.cone?.create?.(placeable, config),
        stop: (token: any, config: any = {}) => getBbcApi().crosshair?.cone?.stop?.(token, config)
    },
    circle: {
        play: (placeable: any = null, config: any = {}) => playShape('circle', placeable, config),
        create: (placeable: any = null, config: any = {}) => getBbcApi().crosshair?.circle?.create?.(placeable, config),
        stop: (token: any, config: any = {}) => getBbcApi().crosshair?.circle?.stop?.(token, config)
    },
    ray: {
        play: (placeable: any = null, config: any = {}) => playShape('ray', placeable, config),
        create: (placeable: any = null, config: any = {}) => getBbcApi().crosshair?.ray?.create?.(placeable, config),
        stop: (token: any, config: any = {}) => getBbcApi().crosshair?.ray?.stop?.(token, config)
    },
    square: {
        play: (placeable: any = null, config: any = {}) => playShape('square', placeable, config),
        create: (placeable: any = null, config: any = {}) => getBbcApi().crosshair?.square?.create?.(placeable, config),
        stop: (token: any, config: any = {}) => getBbcApi().crosshair?.square?.stop?.(token, config)
    },
    play: (shape: string, placeable: any = null, config: any = {}) => playShape(shape, placeable, config)
};
