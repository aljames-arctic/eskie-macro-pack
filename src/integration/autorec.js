import { MODULE_ID } from "../lib/constants.js";
import { log } from '../lib/logger.js';
import { localize, format } from "../lib/utils.js";
import { autoanimations } from "./autoanimations.js";
import { blfx } from "./blfx.js";
import { AutorecDestinationDialog } from "./autorec/destinationDialog.js";

/**
 * Unified Auto-Recognition Manager for Eskie Macro Pack.
 * Handles simultaneous registration across Automated Animations (AA) and Boss Loot FX (BLFX),
 * and enforces user destination preferences so only one integration is stored at a time.
 */

/**
 * Registers an animation entry simultaneously into Automated Animations and Boss Loot FX.
 * @param {string} key Unique identifier key or localized name
 * @param {string} trigger Trigger category ('token', 'template', 'melee-target', 'ranged-target', 'aura', 'effect')
 * @param {string} animation Global function path (e.g. "eskie.effect.armsOfHadar")
 * @param {object} config Configuration object passed to the effect
 * @param {string} [version="0.0.0"] Entry version
 * @param {string} [fallback=key] Human-readable fallback name
 * @param {object} [options={}] Additional integration-specific configuration
 */
export function register(key, trigger, animation, config, version = "0.0.0", fallback = key, options = {}) {
    // 1. Register to Automated Animations internal registry
    autoanimations.register(key, trigger, animation, config, version, fallback);

    // 2. Register to Boss Loot FX internal registry
    blfx.register(key, trigger, animation, config, version, fallback, options);
}

/**
 * Formats a key for active concentration effects.
 * @param {string} key The effect key
 * @param {string} [fallback=key] Human-readable fallback label
 * @returns {string} Formatted concentrating name
 */
export function CONCENTRATING(key, fallback = key) {
    const localizedName = (key.includes(":") || key.includes(" ")) ? key : localize(`EMP.effects.${key}`, fallback);
    return format("EMP.effects.concentratingPrefix", { name: localizedName }, `Concentrating: ${localizedName}`);
}

/**
 * Executes the submission process according to the world's configured autorecTarget.
 * If set to 'ask', prompts the GM to select their desired destination.
 * @param {object} [options={}]
 * @param {boolean} [options.force=false] Force submission regardless of version
 * @returns {Promise<void>}
 */
export async function submit(options = {}) {
    if (!game.user?.isGM) return;

    const target = game.settings?.get(MODULE_ID, 'autorecTarget') ?? 'ask';

    log.debug(`EMP | AutorecManager.submit called with configured target: "${target}"`);

    switch (target) {
        case 'autoanimations':
            await autoanimations.submit();
            break;

        case 'blfx':
            await blfx.submit(options.force ?? false);
            break;

        case 'none':
            log.debug("EMP | Autorec integration disabled in settings.");
            break;

        case 'ask':
        default: {
            const isAaActive = Boolean(game.modules?.get('autoanimations')?.active);
            const isBlfxActive = Boolean(
                game.modules?.get('boss-loot-assets-premium')?.active ||
                game.modules?.get('boss-loot-assets-free')?.active ||
                game.modules?.get('blfx')?.active ||
                Hooks.events?.['blfx.register.CustomAutoRec']
            );

            // If neither companion integration is active, skip silently
            if (!isAaActive && !isBlfxActive) {
                log.debug("EMP | Neither Automated Animations nor Boss Loot FX is active. Skipping autorec destination prompt.");
                return;
            }

            // Prompt the GM with the destination selection dialog
            new AutorecDestinationDialog().render(true);
            break;
        }
    }
}

/**
 * Opens the destination choice dialog manually.
 */
export function promptDestinationDialog() {
    new AutorecDestinationDialog().render(true);
}

export const autorec = {
    register,
    submit,
    promptDestinationDialog,
    CONCENTRATING,
    autoanimations,
    blfx
};
