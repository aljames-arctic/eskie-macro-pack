import { MODULE_ID } from "../../../lib/constants.js";
import { log } from '../../../lib/logger.js';
import { localize, format } from "../../../lib/utils.js";
import { autoanimationsAdapter } from "../autoanimations/autoanimations-module-adapter.js";
import { blfxAdapter } from "../blfx/blfx-module-adapter.js";
import { AutorecDestinationDialog } from "./destinationDialog.js";

/**
 * Unified Auto-Recognition (Autorec) Manager for Eskie Macro Pack.
 * Coordinates automatic animation recognition registration across Automated Animations (AA)
 * and Boss Loot FX (BLFX), enforcing user destination preferences.
 */
export class AutorecManager {
    constructor(aa = autoanimationsAdapter, blfx = blfxAdapter) {
        this.aa = aa;
        this.blfx = blfx;
    }

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
    register(key, trigger, animation, config, version = "0.0.0", fallback = key, options = {}) {
        this.aa.register(key, trigger, animation, config, version, fallback);
        this.blfx.register(key, trigger, animation, config, version, fallback, options);
    }

    /**
     * Formats a key for active concentration effects.
     * @param {string} key The effect key
     * @param {string} [fallback=key] Human-readable fallback label
     * @returns {string} Formatted concentrating name
     */
    CONCENTRATING(key, fallback = key) {
        const localizedName = (typeof key === 'string' && (key.includes(":") || key.includes(" "))) ? key : localize(`EMP.effects.${key}`, fallback);
        return format("EMP.effects.concentratingPrefix", { name: localizedName }, `Concentrating: ${localizedName}`);
    }

    /**
     * Executes the submission process according to the world's configured autorecTarget.
     * If set to 'ask', prompts the GM to select their desired destination.
     * @param {object} [options={}]
     * @param {boolean} [options.force=false] Force submission regardless of version
     * @returns {Promise<void>}
     */
    async submit(options = {}) {
        if (!game?.user?.isGM) return;

        const target = game.settings?.get(MODULE_ID, 'autorecTarget') ?? 'ask';
        log.debug(`EMP | AutorecManager.submit called with configured target: "${target}"`);

        switch (target) {
            case 'autoanimations':
                await this.aa.submit();
                break;

            case 'blfx':
                await this.blfx.submit(options.force ?? false);
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
                    Hooks?.events?.['blfx.register.CustomAutoRec']
                );

                if (!isAaActive && !isBlfxActive) {
                    log.debug("EMP | Neither Automated Animations nor Boss Loot FX is active. Skipping autorec destination prompt.");
                    return;
                }

                new AutorecDestinationDialog().render(true);
                break;
            }
        }
    }

    /**
     * Opens the destination choice dialog manually.
     */
    promptDestinationDialog() {
        new AutorecDestinationDialog().render(true);
    }
}

export const autorecManager = new AutorecManager();

export function register(key, trigger, animation, config, version = "0.0.0", fallback = key, options = {}) {
    return autorecManager.register(key, trigger, animation, config, version, fallback, options);
}

export function CONCENTRATING(key, fallback = key) {
    return autorecManager.CONCENTRATING(key, fallback);
}

export async function submit(options = {}) {
    return autorecManager.submit(options);
}

export function promptDestinationDialog() {
    return autorecManager.promptDestinationDialog();
}

export const autorec = {
    register,
    submit,
    promptDestinationDialog,
    CONCENTRATING,
    autoanimations: autoanimationsAdapter,
    blfx: blfxAdapter
};
