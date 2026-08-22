import { MODULE_ID } from "../lib/constants.js";
import { log } from '../lib/logger.js';
import { localize } from "../lib/utils.js";
import { BlfxAutorecUpdateFormApplication, generateBlfxAutorecUpdate } from "./blfx/updateMenu.js";

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
                customAutoRecognition: true
            }
        },
        customAutoRecognition: foundry.utils.duplicate(EMP_BLFX_Registry)
    };
}

/**
 * Safely merges EMP BLFX entries into the existing BLFX custom auto-recognition tree.
 * Preserves user-created custom animations while adding new EMP effects and updating existing EMP effects.
 * @param {object} existingData Existing BLFX customAutoRecognition settings data
 * @param {object} empRegistry EMP's internal BLFX registry
 * @returns {object} Merged payload ready for the blfx.register.CustomAutoRec hook
 */
export function mergeBlfxCustomAutoRec(existingData, empRegistry) {
    let baseCustomTree = {};
    if (existingData?.customAutoRecognition && typeof existingData.customAutoRecognition === 'object') {
        baseCustomTree = foundry.utils.duplicate(existingData.customAutoRecognition);
    } else if (existingData?.flags?.['boss-loot-assets-premium']?.customAutoRecognition && typeof existingData.flags['boss-loot-assets-premium'].customAutoRecognition === 'object') {
        baseCustomTree = foundry.utils.duplicate(existingData.flags['boss-loot-assets-premium'].customAutoRecognition);
    } else if (existingData && typeof existingData === 'object' && !existingData.flags) {
        baseCustomTree = foundry.utils.duplicate(existingData);
    }

    const mergedTree = foundry.utils.duplicate(baseCustomTree);

    for (const [systemId, items] of Object.entries(empRegistry)) {
        if (!mergedTree[systemId]) {
            mergedTree[systemId] = {};
        }

        for (const [itemSlug, activities] of Object.entries(items)) {
            if (!mergedTree[systemId][itemSlug]) {
                mergedTree[systemId][itemSlug] = {};
            }

            for (const [activitySlug, triggers] of Object.entries(activities)) {
                if (!mergedTree[systemId][itemSlug][activitySlug]) {
                    mergedTree[systemId][itemSlug][activitySlug] = {};
                }

                for (const [triggerMode, newEntry] of Object.entries(triggers)) {
                    const existingEntry = mergedTree[systemId][itemSlug][activitySlug][triggerMode];

                    if (!existingEntry) {
                        // Effect does not exist: ADD it
                        mergedTree[systemId][itemSlug][activitySlug][triggerMode] = newEntry;
                    } else if (existingEntry.note?.includes?.("Eskie Macro Pack")) {
                        // Existing entry was registered by EMP: UPDATE to latest version
                        mergedTree[systemId][itemSlug][activitySlug][triggerMode] = newEntry;
                    } else {
                        // Existing entry is custom user created: PRESERVE user custom animation
                        log.debug(`EMP | Preserving user custom BLFX entry for ${itemSlug}/${activitySlug}/${triggerMode}`);
                    }
                }
            }
        }
    }

    return {
        flags: {
            "boss-loot-assets-premium": {
                customAutoRecognition: true
            }
        },
        customAutoRecognition: mergedTree
    };
}

/**
 * Generates a monotonically increasing version string formatted as YY.MM.DD.HH.MM.SS for development builds.
 * @returns {string} Timestamp-based version string
 */
function getDevelopmentVersion() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${yy}.${mm}.${dd}.${hh}.${min}.${ss}`;
}

/**
 * Submits registered animations to Boss Loot FX via the blfx.register.CustomAutoRec Hook.
 * Performs a non-destructive merge with any existing custom autorec data in world settings.
 * @param {boolean} [force=false] Force update regardless of version check
 * @returns {Promise<void>}
 */
export async function submit(force = false) {
    if (!game.user?.isGM) return;

    const rawVersion = game.modules?.get(MODULE_ID)?.version ?? "1.0.0";
    const isDevelopment = rawVersion === "#{VERSION}#";
    const effectiveVersion = isDevelopment ? getDevelopmentVersion() : rawVersion;
    const lastUpdate = game.settings?.get(MODULE_ID, "blfxAutorecVersion") ?? "0.0.0";
    const shouldUpdate = force || isDevelopment || foundry.utils.isNewerVersion(effectiveVersion, lastUpdate);

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

    log.debug(`EMP | Checking Boss Loot FX Custom Auto-Rec (version: ${effectiveVersion})...`);

    const { missingEntries, updatedEntries, customEntries } = await generateBlfxAutorecUpdate(EMP_BLFX_Registry);
    if (missingEntries.length || updatedEntries.length || customEntries.length) {
        new BlfxAutorecUpdateFormApplication(EMP_BLFX_Registry).render(true);
    } else {
        log.info(localize("EMP.blfxUpdateMenu.nothing", "All Eskie Macro Pack animations are up to date in Boss Loot FX!"));
    }
}

export const blfx = {
    register,
    buildBlfxPayload,
    submit,
    registry: EMP_BLFX_Registry
};
