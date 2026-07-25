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
 * Normalizes polymorphic caller arguments into a valid canvas template placeable and configuration object.
 * Validates that tokens or tiles are not passed as the target placeable to prevent BBC from hiding them.
 *
 * @param {object|null} targetOrPlaceable Potential template/region placeable or token object
 * @param {object} [config={}] Configuration options
 * @returns {{placeable: object|null, config: object}} Normalized placeable and options
 */
function normalizeCrosshairInvocation(targetOrPlaceable, config = {}) {
    const docName = targetOrPlaceable?.documentName ?? targetOrPlaceable?.document?.documentName;
    const isTokenOrTile = docName === 'Token' || docName === 'Tile';

    if (isTokenOrTile) {
        log.debug(`normalizeCrosshairInvocation | Passed object is a ${docName} ("${targetOrPlaceable?.name ?? targetOrPlaceable?.document?.name}"), normalizing to token config.`);
        return {
            placeable: null,
            config: foundry.utils.mergeObject({ token: targetOrPlaceable }, config, { inplace: false })
        };
    }

    const isTemplateOrRegion = docName === 'MeasuredTemplate' || docName === 'Region';
    if (!isTemplateOrRegion && targetOrPlaceable !== null && targetOrPlaceable !== undefined) {
        log.warn('normalizeCrosshairInvocation | First parameter is neither a template placeable nor a Token/Tile.', targetOrPlaceable);
    }

    return {
        placeable: targetOrPlaceable ?? null,
        config: config ?? {}
    };
}

/**
 * Delegates a specific shape crosshair play invocation to BBC.
 *
 * @param {string} shape The shape name ('cone', 'circle', 'ray', 'square')
 * @param {object|null} targetOrPlaceable The canvas MeasuredTemplate/Region placeable or source Token
 * @param {object} [rawConfig={}] Shape configuration options
 * @returns {Promise<unknown>} The BBC play sequence result
 */
async function playShape(shape, targetOrPlaceable, rawConfig = {}) {
    const api = getBbcApi();
    const { placeable, config } = normalizeCrosshairInvocation(targetOrPlaceable, rawConfig);
    log.debug(`Delegating crosshair "${shape}" play to BBC API for target:`, placeable?.id ?? config.token?.name);
    const shapeBuilder = api.crosshair?.[shape] ?? api.crosshair?.circle;
    if (typeof shapeBuilder?.play === 'function') {
        return shapeBuilder.play(placeable, config);
    }
    return api.crosshair.play(shape, placeable, config);
}

export const crosshair = {
    cone: {
        play: (targetOrPlaceable, config = {}) => playShape('cone', targetOrPlaceable, config),
        create: (targetOrPlaceable, config = {}) => {
            const { placeable, config: normConfig } = normalizeCrosshairInvocation(targetOrPlaceable, config);
            return getBbcApi().crosshair?.cone?.create?.(placeable, normConfig);
        },
        stop: (token, config = {}) => getBbcApi().crosshair?.cone?.stop?.(token, config)
    },
    circle: {
        play: (targetOrPlaceable, config = {}) => playShape('circle', targetOrPlaceable, config),
        create: (targetOrPlaceable, config = {}) => {
            const { placeable, config: normConfig } = normalizeCrosshairInvocation(targetOrPlaceable, config);
            return getBbcApi().crosshair?.circle?.create?.(placeable, normConfig);
        },
        stop: (token, config = {}) => getBbcApi().crosshair?.circle?.stop?.(token, config)
    },
    ray: {
        play: (targetOrPlaceable, config = {}) => playShape('ray', targetOrPlaceable, config),
        create: (targetOrPlaceable, config = {}) => {
            const { placeable, config: normConfig } = normalizeCrosshairInvocation(targetOrPlaceable, config);
            return getBbcApi().crosshair?.ray?.create?.(placeable, normConfig);
        },
        stop: (token, config = {}) => getBbcApi().crosshair?.ray?.stop?.(token, config)
    },
    square: {
        play: (targetOrPlaceable, config = {}) => playShape('square', targetOrPlaceable, config),
        create: (targetOrPlaceable, config = {}) => {
            const { placeable, config: normConfig } = normalizeCrosshairInvocation(targetOrPlaceable, config);
            return getBbcApi().crosshair?.square?.create?.(placeable, normConfig);
        },
        stop: (token, config = {}) => getBbcApi().crosshair?.square?.stop?.(token, config)
    },
    play: (typeOrPlaceable, placeableOrConfig, config) => {
        const api = getBbcApi();
        if (typeof typeOrPlaceable === 'string') {
            const { placeable, config: normConfig } = normalizeCrosshairInvocation(placeableOrConfig, config);
            return api.crosshair.play(typeOrPlaceable, placeable, normConfig);
        }
        const { placeable, config: normConfig } = normalizeCrosshairInvocation(typeOrPlaceable, placeableOrConfig);
        return api.crosshair.play(placeable, normConfig);
    }
};
