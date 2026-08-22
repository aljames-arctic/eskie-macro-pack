import { MODULE_ID } from "../lib/constants.js";
import { log } from '../lib/logger.js';
import { localize } from "../lib/utils.js";

/**
 * Internal registry storing Boss Loot FX auto-recognition entries grouped by system -> item -> activity -> trigger.
 */
export const EMP_BLFX_Registry = {};

/**
 * Standardize trigger mode for BLFX.
 * Supported BLFX trigger modes: 'afterItemUse', 'afterAttack', 'afterDamage', 'templatePlaced', etc.
 * @param {string} trigger AA-style trigger name
 * @param {string} [customTrigger] Optional explicit BLFX trigger override
 * @returns {string} Standardized BLFX trigger name
 */
function standardizeBlfxTrigger(trigger, customTrigger) {
    if (customTrigger) return customTrigger;
    trigger = (trigger ?? '').toLowerCase();
    switch (trigger) {
        case "melee":
        case "melee-target":
        case "range":
        case "ranged-target":
            return "afterAttack";
        case "template":
        case "templatefx":
        case "aura":
        case "token":
        case "ontoken":
        case "effect":
        case "aefx":
        case "preset":
        default:
            return "afterItemUse";
    }
}

/**
 * Creates a JavaScript macro command string for BLFX to invoke an Eskie Macro Pack effect.
 * @param {string} animation Global function path (e.g. "eskie.effect.armsOfHadar")
 * @param {string} trigger Trigger type
 * @param {object} config Configuration object passed to the effect
 * @returns {string} Generated JavaScript snippet
 */
function buildBlfxMacroCommand(animation, trigger, config) {
    const isTargeted = ['melee', 'range', 'melee-target', 'ranged-target'].includes(trigger);
    const serializedConfig = JSON.stringify(config ?? {});

    if (isTargeted) {
        return `// Eskie Macro Pack Autorec (Targeted)
const token = (typeof workflow !== 'undefined' && workflow?.token) || canvas.tokens?.controlled?.[0] || (typeof speaker !== 'undefined' ? ChatMessage.getSpeakerActor(speaker)?.getActiveTokens?.()?.[0] : null);
const target = (typeof workflow !== 'undefined' && workflow?.targets?.first?.()) || (typeof targets !== 'undefined' && targets[0]) || Array.from(game.user?.targets ?? [])[0];
const config = ${serializedConfig};
const effect = foundry.utils.getProperty(globalThis, '${animation}');
if (effect?.play) {
    if (target) {
        await effect.play(token, target, config);
    } else if (token) {
        await effect.play(token, config);
    }
}`;
    }

    return `// Eskie Macro Pack Autorec
const token = (typeof workflow !== 'undefined' && workflow?.token) || canvas.tokens?.controlled?.[0] || (typeof speaker !== 'undefined' ? ChatMessage.getSpeakerActor(speaker)?.getActiveTokens?.()?.[0] : null);
const config = ${serializedConfig};
const effect = foundry.utils.getProperty(globalThis, '${animation}');
if (effect?.play && token) {
    await effect.play(token, config);
}`;
}

/**
 * Register an animation entry into the internal BLFX registry.
 * @param {string} key Identifier key or localized name
 * @param {string} trigger Trigger category ('token', 'template', 'melee-target', etc.)
 * @param {string} animation Global animation handler path (e.g. "eskie.effect.armsOfHadar")
 * @param {object} config Configuration object
 * @param {string} [version="0.0.0"] Entry version
 * @param {string} [fallback=key] Fallback label
 * @param {object} [options={}] Additional BLFX-specific overrides
 */
export function register(key, trigger, animation, config, version = "0.0.0", fallback = key, options = {}) {
    const systemId = options.systemId ?? game?.system?.id ?? 'dnd5e';
    const localizedLabel = (key.includes(":") || key.includes(" ")) ? key : localize(`EMP.effects.${key}`, fallback);
    const itemName = options.itemName ?? localizedLabel;
    const itemSlug = options.itemSlug ?? (foundry.utils?.slugify ? foundry.utils.slugify(itemName) : itemName.toLowerCase().replace(/[^a-z0-9]/g, '-'));
    const activityName = options.activityName ?? "Default";
    const activitySlug = options.activitySlug ?? (activityName ? (foundry.utils?.slugify ? foundry.utils.slugify(activityName) : activityName.toLowerCase().replace(/[^a-z0-9]/g, '-')) : "default");
    const triggerMode = standardizeBlfxTrigger(trigger, options.blfxTrigger);
    const command = options.command ?? buildBlfxMacroCommand(animation, trigger, config);

    const entry = {
        animationName: localizedLabel,
        itemName: itemName,
        activityName: activityName,
        triggerName: triggerMode,
        note: `Eskie Macro Pack (${version})`,
        animationData: {
            command: command
        }
    };

    if (!EMP_BLFX_Registry[systemId]) {
        EMP_BLFX_Registry[systemId] = {};
    }
    if (!EMP_BLFX_Registry[systemId][itemSlug]) {
        EMP_BLFX_Registry[systemId][itemSlug] = {};
    }
    if (!EMP_BLFX_Registry[systemId][itemSlug][activitySlug]) {
        EMP_BLFX_Registry[systemId][itemSlug][activitySlug] = {};
    }

    EMP_BLFX_Registry[systemId][itemSlug][activitySlug][triggerMode] = entry;
}

/**
 * Builds the complete nested BLFX resources payload.
 * @returns {object} Resources object matching BLFX format
 */
export function buildBlfxPayload() {
    return {
        flags: {
            "boss-loot-assets-premium": {
                customAutoRecognition: foundry.utils.duplicate(EMP_BLFX_Registry)
            }
        }
    };
}

/**
 * Submits registered animations to Boss Loot FX via the blfx.register.CustomAutoRec Hook.
 * Performs a non-destructive merge with any existing custom autorec data in world settings.
 * @param {boolean} [force=false] Force update regardless of version check
 * @returns {Promise<void>}
 */
export async function submit(force = false) {
    if (!game.user?.isGM) return;

    const developmentVersion = "#{VERSION}#";
    const moduleVersion = game.modules?.get(MODULE_ID)?.version ?? "1.0.0";
    const lastUpdate = game.settings?.get(MODULE_ID, "blfxAutorecVersion") ?? "0.0.0";
    const shouldUpdate = force || moduleVersion === developmentVersion || foundry.utils.isNewerVersion(moduleVersion, lastUpdate);

    if (!shouldUpdate) return;

    const isBlfxActive = Boolean(
        game.modules?.get('boss-loot-assets-premium')?.active ||
        game.modules?.get('boss-loot-assets-free')?.active ||
        game.modules?.get('blfx')?.active ||
        Hooks.events?.['blfx.register.CustomAutoRec']
    );

    if (!isBlfxActive) {
        log.debug("EMP | Boss Loot FX (BLFX) integration skipped: module not active.");
        return;
    }

    log.info("EMP | Registering effects into Boss Loot FX Custom Auto-Rec...");

    let existingSettings = {};
    try {
        if (game.settings?.settings?.has('boss-loot-assets-premium.blfxCustomAutoRecognition')) {
            existingSettings = game.settings.get('boss-loot-assets-premium', 'blfxCustomAutoRecognition') ?? {};
        }
    } catch (err) {
        log.debug("EMP | Could not read existing blfxCustomAutoRecognition setting:", err);
    }

    const empPayload = buildBlfxPayload();
    const mergedResources = foundry.utils.mergeObject(existingSettings, empPayload, { inplace: false, overwrite: true });

    Hooks.call('blfx.register.CustomAutoRec', mergedResources, MODULE_ID, moduleVersion);

    if (moduleVersion !== developmentVersion && game.settings) {
        await game.settings.set(MODULE_ID, "blfxAutorecVersion", moduleVersion);
    }

    log.info("EMP | Successfully synced custom auto-recognition to Boss Loot FX!");
}

export const blfx = {
    register,
    buildBlfxPayload,
    submit,
    registry: EMP_BLFX_Registry
};
