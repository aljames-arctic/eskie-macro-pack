import { BaseModuleAdapter } from "../base-module-adapter.js";
import { MODULE_ID } from "../../../lib/constants.js";
import { log } from '../../../lib/logger.js';
import { localize } from "../../../lib/utils.js";
import { BlfxAutorecUpdateFormApplication, generateBlfxAutorecUpdate } from "../../../ui/blfx/updateMenu.js";

/**
 * Internal registry storing Boss Loot FX auto-recognition entries grouped by system -> item -> activity -> trigger.
 */
export const EMP_BLFX_Registry = {};

/**
 * Standard trigger key mapping for BLFX Custom Auto-Recognition.
 */
export const BLFX_TRIGGER_MAP = {
    melee: "afterAttack",
    "melee-target": "afterAttack",
    range: "afterAttack",
    "ranged-target": "afterAttack",
    attack: "afterAttack",
    afterattack: "afterAttack",
    damage: "afterDamage",
    afterdamage: "afterDamage",
    template: "createTemplate",
    templatefx: "createTemplate",
    createtemplate: "createTemplate",
    summon: "afterSummon",
    aftersummon: "afterSummon",
    effect: "afterActiveEffects",
    aefx: "afterActiveEffects",
    "active-effect": "afterActiveEffects",
    ae: "afterActiveEffects",
    afteractiveeffects: "afterActiveEffects",
    token: "afterItemUse",
    ontoken: "afterItemUse",
    aura: "afterItemUse",
    preset: "afterItemUse",
    afteritemuse: "afterItemUse"
};

/**
 * Standard display names for BLFX trigger categories.
 */
export const BLFX_TRIGGER_NAMES = {
    afterItemUse: "After Activity Use (Default)",
    afterAttack: "After Attack Roll",
    afterDamage: "After Damage Roll",
    afterActiveEffects: "After Active Effects",
    afterSummon: "After Summon",
    createTemplate: "After Template Create"
};

/**
 * Standardize trigger mode for BLFX.
 * Supported BLFX trigger modes: 'afterItemUse', 'afterAttack', 'afterDamage', 'afterActiveEffects', 'createTemplate', 'afterSummon'.
 * @param {string} trigger AA-style trigger name
 * @param {string} [customTrigger] Optional explicit BLFX trigger override
 * @returns {string} Standardized BLFX trigger name
 */
export function standardizeBlfxTrigger(trigger, customTrigger) {
    if (customTrigger) return customTrigger;
    const cleanTrigger = (trigger ?? '').toLowerCase();
    return BLFX_TRIGGER_MAP[cleanTrigger] ?? "afterItemUse";
}

/**
 * Creates a JavaScript macro command string for BLFX to invoke an Eskie Macro Pack effect.
 * @param {string} animation Global function path (e.g. "eskie.effect.armsOfHadar")
 * @param {string} trigger Trigger type
 * @param {object} config Configuration object passed to the effect
 * @returns {string} Generated JavaScript snippet
 */
export function buildBlfxMacroCommand(animation, trigger, config) {
    const standardized = standardizeBlfxTrigger(trigger);
    const serializedConfig = JSON.stringify(config ?? {});

    if (standardized === 'afterActiveEffects') {
        return `// Eskie Macro Pack Autorec (On Target or Token - AE)
const source = (typeof sourceToken !== 'undefined' && sourceToken) || null;
const target = (typeof targetTokens !== 'undefined' && (targetTokens[0] ?? targetTokens.first?.())) || null;
const token = target || source || (typeof workflow !== 'undefined' && workflow?.token) || canvas?.tokens?.controlled?.[0] || null;
const config = ${serializedConfig};
if (typeof effect !== 'undefined' && effect) {
    config.activeEffect = effect;
}
const effectFn = foundry.utils.getProperty(globalThis, '${animation}');
if (effectFn?.play) {
    if (source && target && source.id !== target.id) {
        await effectFn.play(source, target, config);
    } else if (token) {
        await effectFn.play(token, config);
    }
}`;
    }

    if (standardized === 'createTemplate') {
        return `// Eskie Macro Pack Autorec (Template)
const token = (typeof sourceToken !== 'undefined' && sourceToken) || (typeof workflow !== 'undefined' && workflow?.token) || canvas?.tokens?.controlled?.[0] || null;
const template = typeof templateDocument !== 'undefined' ? templateDocument : null;
const config = ${serializedConfig};
if (template) config.template = template;
if (typeof targetTokens !== 'undefined' && targetTokens?.length) config.targets = targetTokens;
const effect = foundry.utils.getProperty(globalThis, '${animation}');
if (effect?.play && token) {
    await effect.play(token, config);
}`;
    }

    if (standardized === 'afterSummon') {
        return `// Eskie Macro Pack Autorec (Summon)
const token = (typeof sourceToken !== 'undefined' && sourceToken) || (typeof workflow !== 'undefined' && workflow?.token) || canvas?.tokens?.controlled?.[0] || null;
const targets = (typeof targetTokens !== 'undefined' && targetTokens?.length) ? targetTokens : [];
const config = ${serializedConfig};
if (targets.length) config.targets = targets;
const effect = foundry.utils.getProperty(globalThis, '${animation}');
if (effect?.play && token) {
    await effect.play(token, config);
}`;
    }

    if (standardized === 'afterAttack' || standardized === 'afterDamage') {
        return `// Eskie Macro Pack Autorec (Targeted)
const token = (typeof sourceToken !== 'undefined' && sourceToken) || (typeof workflow !== 'undefined' && workflow?.token) || canvas?.tokens?.controlled?.[0] || null;
const target = (typeof targetTokens !== 'undefined' && (targetTokens?.first?.() ?? Array.from(targetTokens ?? [])[0])) || (typeof workflow !== 'undefined' && (workflow?.targets?.first?.() ?? Array.from(workflow?.targets ?? [])[0])) || Array.from(game.user?.targets ?? [])[0] || null;
const config = ${serializedConfig};
const effect = foundry.utils.getProperty(globalThis, '${animation}');
if (effect?.play) {
    if (target) {
        await effect.play(token, target, config);
    } else if (token) {
        await effect.play(token, config);
    }
} `;
    }

    return `// Eskie Macro Pack Autorec
const token = (typeof sourceToken !== 'undefined' && sourceToken) || (typeof workflow !== 'undefined' && workflow?.token) || canvas?.tokens?.controlled?.[0] || null;
const config = ${serializedConfig};
const effect = foundry.utils.getProperty(globalThis, '${animation}');
if (effect?.play && token) {
    await effect.play(token, config);
}`;
}

/**
 * Builds the complete nested BLFX resources payload.
 * @param {object} [registry=EMP_BLFX_Registry] Internal registry
 * @returns {object} Resources object matching BLFX format
 */
export function buildBlfxPayload(registry = EMP_BLFX_Registry) {
    return {
        flags: {
            "boss-loot-assets-premium": {
                customAutoRecognition: true
            },
            "boss-loot-assets-free": {
                customAutoRecognition: true
            },
            "blfx": {
                customAutoRecognition: true
            }
        },
        customAutoRecognition: foundry.utils.duplicate(registry)
    };
}

/**
 * Safely merges EMP BLFX entries into the existing BLFX custom auto-recognition tree.
 * Preserves user-created custom animations while adding new EMP effects and updating existing EMP effects.
 * @param {object} existingData Existing BLFX customAutoRecognition settings data
 * @param {object} empRegistry EMP's internal BLFX registry
 * @returns {object} Merged payload ready for the blfx.register.CustomAutoRec hook
 */
export function mergeBlfxCustomAutoRec(existingData, empRegistry = EMP_BLFX_Registry) {
    let baseCustomTree = {};
    if (typeof existingData === 'string') {
        try { existingData = JSON.parse(existingData); } catch {}
    }
    if (existingData?.customAutoRecognition && typeof existingData.customAutoRecognition === 'object' && !Array.isArray(existingData.customAutoRecognition)) {
        baseCustomTree = foundry.utils.duplicate(existingData.customAutoRecognition);
    } else if (existingData?.flags?.['boss-loot-assets-premium']?.customAutoRecognition && typeof existingData.flags['boss-loot-assets-premium'].customAutoRecognition === 'object') {
        baseCustomTree = foundry.utils.duplicate(existingData.flags['boss-loot-assets-premium'].customAutoRecognition);
    } else if (existingData && typeof existingData === 'object' && !Array.isArray(existingData) && !existingData.flags) {
        baseCustomTree = foundry.utils.duplicate(existingData);
    }
    if (typeof baseCustomTree !== 'object' || baseCustomTree === null || Array.isArray(baseCustomTree)) {
        baseCustomTree = {};
    }

    const mergedTree = foundry.utils.duplicate(baseCustomTree);

    for (const [systemId, items] of Object.entries(empRegistry ?? {})) {
        if (!items || typeof items !== 'object') continue;
        if (!mergedTree[systemId] || typeof mergedTree[systemId] !== 'object') {
            mergedTree[systemId] = {};
        }

        for (const [itemSlug, activities] of Object.entries(items)) {
            if (!activities || typeof activities !== 'object') continue;
            if (!mergedTree[systemId][itemSlug] || typeof mergedTree[systemId][itemSlug] !== 'object') {
                mergedTree[systemId][itemSlug] = {};
            }

            for (const [activitySlug, triggers] of Object.entries(activities)) {
                if (!triggers || typeof triggers !== 'object') continue;
                if (!mergedTree[systemId][itemSlug][activitySlug] || typeof mergedTree[systemId][itemSlug][activitySlug] !== 'object') {
                    mergedTree[systemId][itemSlug][activitySlug] = {};
                }

                for (const [triggerMode, newEntry] of Object.entries(triggers)) {
                    if (!newEntry || typeof newEntry !== 'object') continue;
                    const existingEntry = mergedTree[systemId][itemSlug][activitySlug][triggerMode];

                    if (!existingEntry || typeof existingEntry !== 'object') {
                        mergedTree[systemId][itemSlug][activitySlug][triggerMode] = newEntry;
                    } else if (typeof existingEntry.note === 'string' && existingEntry.note.includes("Eskie Macro Pack")) {
                        mergedTree[systemId][itemSlug][activitySlug][triggerMode] = newEntry;
                    } else {
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
            },
            "boss-loot-assets-free": {
                customAutoRecognition: true
            },
            "blfx": {
                customAutoRecognition: true
            }
        },
        customAutoRecognition: mergedTree
    };
}

/**
 * Boss Loot FX (BLFX) Module Adapter.
 * Encapsulates Boss Loot FX and Boss Loot Assets custom auto-recognition payload generation,
 * internal registry storage, and hook submission.
 */
export class BlfxModuleAdapter extends BaseModuleAdapter {
    constructor() {
        super("blfx");
        this.registry = EMP_BLFX_Registry;
    }

    /**
     * Standardize trigger mode for BLFX.
     * @param {string} trigger AA-style trigger name
     * @param {string} [customTrigger] Optional explicit override
     * @returns {string}
     */
    standardizeTrigger(trigger, customTrigger) {
        return standardizeBlfxTrigger(trigger, customTrigger);
    }

    /**
     * Builds macro command string for BLFX.
     */
    buildMacroCommand(animation, trigger, config) {
        return buildBlfxMacroCommand(animation, trigger, config);
    }

    /**
     * Builds resources payload matching BLFX format.
     */
    buildPayload() {
        return buildBlfxPayload(this.registry);
    }

    /**
     * Merges internal registry into existing BLFX settings data.
     */
    mergeCustomAutoRec(existingData) {
        return mergeBlfxCustomAutoRec(existingData, this.registry);
    }

    /**
     * Register an animation entry into the internal BLFX registry.
     * @param {string} key Identifier key or localized name
     * @param {string} trigger Trigger category ('token', 'template', 'melee-target', etc.)
     * @param {string} animation Global animation handler path
     * @param {object} config Configuration object
     * @param {string} [version="0.0.0"] Entry version
     * @param {string} [fallback=key] Fallback label
     * @param {object} [options={}] Additional BLFX-specific overrides
     */
    register(key, trigger, animation, config, version = "0.0.0", fallback = key, options = {}) {
        const systemId = options.systemId ?? game?.system?.id ?? 'dnd5e';
        const localizedLabel = (typeof key === 'string' && (key.includes(":") || key.includes(" "))) ? key : localize(`EMP.effects.${key}`, fallback);
        const itemName = options.itemName ?? localizedLabel ?? String(key ?? 'default');
        const slugName = typeof itemName === 'string' ? itemName : String(itemName);
        const rawItemSlug = options.itemSlug ?? (foundry.utils?.slugify ? foundry.utils.slugify(slugName) : slugName.toLowerCase().replace(/[^a-z0-9]/g, '-'));
        const itemSlug = rawItemSlug ? rawItemSlug : 'default-item';
        const activityName = options.activityName ?? "Default";
        const slugAct = typeof activityName === 'string' ? activityName : String(activityName);
        const rawActivitySlug = options.activitySlug ?? (activityName ? (foundry.utils?.slugify ? foundry.utils.slugify(slugAct) : slugAct.toLowerCase().replace(/[^a-z0-9]/g, '-')) : "default");
        const activitySlug = rawActivitySlug ? rawActivitySlug : 'default';
        const triggerMode = this.standardizeTrigger(trigger, options.blfxTrigger);
        const triggerName = options.triggerName ?? BLFX_TRIGGER_NAMES[triggerMode] ?? triggerMode;
        const command = options.command ?? this.buildMacroCommand(animation, trigger, config);
        const macroType = options.macroType ?? (
            triggerMode === "afterActiveEffects"
                ? "On Target or Token (AE)"
                : (triggerMode === "createTemplate"
                    ? "Template"
                    : (triggerMode === "afterAttack"
                        ? (['melee', 'melee-target'].includes(trigger) ? "Attack Melee" : "Attack Ranged")
                        : (triggerMode === "afterSummon"
                            ? "Summon"
                            : "Macro")))
        );

        const entry = {
            animationName: localizedLabel,
            itemName: itemName,
            activityName: activityName,
            triggerName: triggerName,
            note: `Eskie Macro Pack (${version})`,
            animationData: {
                eventType: triggerName,
                macroType: macroType,
                command: command,
                autoRec: {
                    enabled: true
                },
                version: 2
            }
        };

        if (!this.registry[systemId]) {
            this.registry[systemId] = {};
        }
        if (!this.registry[systemId][itemSlug]) {
            this.registry[systemId][itemSlug] = {};
        }
        if (!this.registry[systemId][itemSlug][activitySlug]) {
            this.registry[systemId][itemSlug][activitySlug] = {};
        }

        this.registry[systemId][itemSlug][activitySlug][triggerMode] = entry;
    }

    /**
     * Submits registered animations to Boss Loot FX via the blfx.register.CustomAutoRec Hook.
     * @param {boolean} [force=false] Force update regardless of version check
     * @returns {Promise<void>}
     */
    async submit(force = false) {
        if (!game?.user?.isGM) return;

        const rawVersion = game?.modules?.get(MODULE_ID)?.version ?? "1.0.0";
        const isDevelopment = rawVersion === "#{VERSION}#";
        const effectiveVersion = isDevelopment ? this._getDevelopmentVersion() : rawVersion;

        let lastUpdate = "0.0.0";
        try {
            if (game?.settings?.settings?.has?.(`${MODULE_ID}.blfxAutorecVersion`)) {
                lastUpdate = game.settings.get(MODULE_ID, "blfxAutorecVersion") ?? "0.0.0";
            }
        } catch {
            lastUpdate = "0.0.0";
        }

        const shouldUpdate = force || isDevelopment || foundry.utils.isNewerVersion(effectiveVersion, lastUpdate);

        if (!shouldUpdate) return;

        const isBlfxActive = Boolean(
            game?.modules?.get('boss-loot-assets-premium')?.active ||
            game?.modules?.get('boss-loot-assets-free')?.active ||
            game?.modules?.get('blfx')?.active ||
            Hooks?.events?.['blfx.register.CustomAutoRec']
        );

        if (!isBlfxActive) {
            log.debug("EMP | Boss Loot FX (BLFX) integration skipped: module not active.");
            return;
        }

        log.debug(`EMP | Checking Boss Loot FX Custom Auto-Rec (version: ${effectiveVersion})...`);

        const { missingEntries, updatedEntries, customEntries } = await generateBlfxAutorecUpdate(this.registry);
        if (missingEntries.length || updatedEntries.length || customEntries.length) {
            new BlfxAutorecUpdateFormApplication(this.registry).render(true);
        } else {
            log.info(localize("EMP.blfxUpdateMenu.nothing", "All Eskie Macro Pack animations are up to date in Boss Loot FX!"));
        }
    }

    _getDevelopmentVersion() {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        return `${yy}.${mm}.${dd}.${hh}.${min}.${ss}`;
    }
}

export const blfxAdapter = new BlfxModuleAdapter();

// Direct API alias object for backward compatibility
export const blfx = {
    register: blfxAdapter.register.bind(blfxAdapter),
    buildBlfxPayload: () => blfxAdapter.buildPayload(),
    mergeBlfxCustomAutoRec: (existingData, empRegistry) => mergeBlfxCustomAutoRec(existingData, empRegistry ?? blfxAdapter.registry),
    submit: (force = false) => blfxAdapter.submit(force),
    registry: EMP_BLFX_Registry
};
