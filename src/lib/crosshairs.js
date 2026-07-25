import { dependency } from './dependency.js';
import { log } from './logger.js';

const BBC_DEPENDENCY = { id: 'bakana-better-crosshairs', ref: "Bakana's Better Crosshairs" };

/**
 * Ensures Bakana's Better Crosshairs (BBC) is active and returns its API.
 *
 * @returns {object} The BBC API object.
 * @throws {Error} If BBC module or crosshair API is uninitialized.
 */
function getBbcApi() {
    dependency.required([BBC_DEPENDENCY]);
    const api = globalThis.bbc ?? game.modules?.get('bakana-better-crosshairs')?.api;
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
 * @param {Token} token The casting Token instance
 * @param {object} [config={}] Shape configuration options
 * @returns {Promise<unknown>} The BBC play sequence result
 */
async function playShape(shape, token, config = {}) {
    const api = getBbcApi();
    log.debug(`Delegating crosshair "${shape}" play to BBC API for token:`, token?.name);
    const shapeBuilder = api.crosshair?.[shape] ?? api.crosshair?.circle;
    if (typeof shapeBuilder?.play === 'function') {
        return shapeBuilder.play(token, config);
    }
    return api.crosshair.play(shape, token, config);
}

export const crosshair = {
    cone: {
        play: (token, config = {}) => playShape('cone', token, config),
        create: (token, config = {}) => getBbcApi().crosshair?.cone?.create?.(token, config),
        stop: (token, config = {}) => getBbcApi().crosshair?.cone?.stop?.(token, config)
    },
    circle: {
        play: (token, config = {}) => playShape('circle', token, config),
        create: (token, config = {}) => getBbcApi().crosshair?.circle?.create?.(token, config),
        stop: (token, config = {}) => getBbcApi().crosshair?.circle?.stop?.(token, config)
    },
    ray: {
        play: (token, config = {}) => playShape('ray', token, config),
        create: (token, config = {}) => getBbcApi().crosshair?.ray?.create?.(token, config),
        stop: (token, config = {}) => getBbcApi().crosshair?.ray?.stop?.(token, config)
    },
    square: {
        play: (token, config = {}) => playShape('square', token, config),
        create: (token, config = {}) => getBbcApi().crosshair?.square?.create?.(token, config),
        stop: (token, config = {}) => getBbcApi().crosshair?.square?.stop?.(token, config)
    },
    play: (typeOrToken, tokenOrConfig, config) => {
        const api = getBbcApi();
        return api.crosshair.play(typeOrToken, tokenOrConfig, config);
    }
};
