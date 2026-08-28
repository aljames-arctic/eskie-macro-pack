import { BaseModuleAdapter } from "../base-module-adapter.js";
import { MODULE_ID } from "../../../lib/constants.js";
import { dependency } from "../../../lib/dependency.js";
import { defaultMenuSettings } from "./defaultMenuSettings.js";
import { autorecUpdateFormApplication, generateAutorecUpdate } from "../../../ui/autoanimations/updateMenu.js";
import { blfxAdapter } from "../blfx/blfx-module-adapter.js";
import { log } from '../../../lib/logger.js';
import { localize, format } from "../../../lib/utils.js";

export const EMP_AA_Menu = {
    melee: [],
    range: [],
    ontoken: [],
    templatefx: [],
    preset: [],
    aura: [],
    aefx: [],
    version: defaultMenuSettings.version,
};

/**
 * Standardizes trigger names to match AA expected values.
 * @param {string} trigger Input trigger name
 * @returns {string} Standardized trigger key
 */
export function standardizeTrigger(trigger) {
    const cleanTrigger = (trigger ?? "").toLowerCase();
    switch (cleanTrigger) {
        case "ontoken":
        case "token":
            return "ontoken";

        case "templatefx":
        case "template":
            return "templatefx";

        case "aura":
            return "aura";

        case "aefx":
        case "effect":
            return "aefx";

        case "melee":
        case "melee-target":
            return "melee";

        case "range":
        case "ranged-target":
            return "range";

        default:
            throw new Error(`EMP + AA | Unknown trigger type "${trigger}"`);
    }
}

// Convert object to stringified JSON and escape quotes
// For instance: { key: "value" } -> "{ "key": \"value\"}"
function JSONformatObject(obj, depth = 1) {
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    const type = typeof obj;
    /* Special case for eskie.effect and eskie.mask functions */
    if (type === 'string' && (obj.startsWith("eskie.effect.") || obj.startsWith("eskie.mask."))) return obj;
    /* Better looking JSON stringify */
    if (type === 'string') return '\'' + obj + '\'';
    if (type === 'boolean' || type === 'number') return obj;
    if (type === 'function') return obj.toString();
    if (Array.isArray(obj)) return JSON.stringify(obj);

    const ret = [];
    for (const prop in obj) {
        ret.push(`\n` + ' '.repeat(depth * 2) + `${prop}: ${JSONformatObject(obj[prop], depth + 1)}`);
    }
    return `{${ret.join(',')}\n}`;
}

/**
 * Formats a key for active concentration effects.
 * @param {string} key The effect key
 * @param {string} [fallback=key] Human-readable fallback label
 * @returns {string} Formatted concentrating name
 */
export function CONCENTRATING(key, fallback = key) {
    const localizedName = (typeof key === 'string' && (key.includes(":") || key.includes(" "))) ? key : localize(`EMP.effects.${key}`, fallback);
    return format("EMP.effects.concentratingPrefix", { name: localizedName }, `Concentrating: ${localizedName}`);
}

/**
 * Automated Animations (AA) Module Adapter.
 * Encapsulates Automated Animations autorec configuration generation, internal menu storage,
 * and dialog synchronization.
 */
export class AutoanimationsModuleAdapter extends BaseModuleAdapter {
    constructor() {
        super("autoanimations");
        this.menu = EMP_AA_Menu;
    }

    /**
     * Standardizes trigger names to match AA expected values.
     * @param {string} trigger Input trigger name
     * @returns {string} Standardized trigger key
     */
    standardizeTrigger(trigger) {
        return standardizeTrigger(trigger);
    }

    /**
     * Creates a template for an Automated Animations autorec entry formatted for Eskie Macro Pack use case.
     * @param {string} key Identifier key
     * @param {string} trigger Trigger category
     * @param {string} animation Global animation handler path
     * @param {object} config Configuration object
     * @param {string} [version="0.0.0"] Version string
     * @param {string} [fallback=key] Fallback label
     * @returns {object} The autorec entry
     */
    createAutorecEntry(key, trigger, animation, config, version = "0.0.0", fallback = key) {
        const stdTrigger = this.standardizeTrigger(trigger);
        const defaultMenu = defaultMenuSettings[stdTrigger];
        const defaultEntry = defaultMenu[0];
        const compendium = `Compendium.${MODULE_ID}.eskie-aa-integration`;

        const localizedLabel = (typeof key === 'string' && (key.includes(":") || key.includes(" "))) ? key : localize(`EMP.effects.${key}`, fallback);

        let name = "UNSPECIFIED MACRO";
        switch (stdTrigger) {
            case "ontoken":
                name = `${compendium}.AA | Token`;
                break;
            case "melee":
            case "range":
                name = `${compendium}.AA | Target`;
                break;
            case "aefx":
                name = `${compendium}.AA | Effect`;
                break;
            case "aura":
            case "templatefx":
                name = `${compendium}.AA | Template`;
                break;
            case "preset":
                break;
            default:
                throw new Error(`EMP + AA | Unknown trigger type "${stdTrigger}" for effect "${name}".`);
        }
        const effectConfig = { ...(config ?? {}), animation };

        const entry = {
            id: foundry.utils.randomID(),
            label: localizedLabel,
            macro: {
                enable: true,
                name: name,
                args: JSONformatObject(effectConfig),
                playWhen: "2"
            },
            metaData: {
                label: localizedLabel,
                menu: stdTrigger,
                name: "Eskie Macro Pack",
                version: version
            }
        };

        return foundry.utils.mergeObject(defaultEntry, entry, { inplace: false });
    }

    /**
     * Registers an animation entry internally into Automated Animations menu and Boss Loot FX registry.
     * @param {string} key Identifier key
     * @param {string} trigger Trigger category ('token', 'template', 'melee-target', etc.)
     * @param {string} animation Global animation handler path
     * @param {object} config Configuration object
     * @param {string} [version="0.0.0"] Version string
     * @param {string} [fallback=key] Fallback label
     * @param {object} [options={}] Additional options
     */
    async register(key, trigger, animation, config, version = "0.0.0", fallback = key, options = {}) {
        const stdTrigger = this.standardizeTrigger(trigger);
        const entry = this.createAutorecEntry(key, stdTrigger, animation, config, version, fallback);
        if (entry) {
            this.menu[stdTrigger].push(entry);
        }
        blfxAdapter.register(key, trigger, animation, config, version, fallback, options);
    }

    /**
     * Submits all internally registered animations to Automated Animations.
     * @returns {Promise<void>}
     */
    async submit() {
        if (!game?.user?.isGM) return;
        const developmentVersion = "#{VERSION}#";
        const moduleVersion = game?.modules?.get(MODULE_ID)?.version ?? "1.0.0";
        const lastUpdate = game?.settings?.get(MODULE_ID, "autorecVersion") ?? "0.0.0";
        const shouldUpdate = moduleVersion === developmentVersion || foundry.utils.isNewerVersion(moduleVersion, lastUpdate);
        if (!shouldUpdate) return;

        if (!dependency.isActivated({ id: "autoanimations", min: "6.5.1" }, localize("EMP.autoanimations.skipped", "EMP | Automated Animations integration skipped."))) {
            return;
        }

        const { missingEntriesList, updatedEntriesList, customEntriesList } = await generateAutorecUpdate(this.menu);
        if (missingEntriesList.length || updatedEntriesList.length || customEntriesList.length) {
            new autorecUpdateFormApplication(this.menu).render(true);
        } else {
            log.info(localize("EMP.updateMenu.nothing", "All Eskie Macro Pack animations are up to date!"));
        }

        if (moduleVersion !== developmentVersion && game.settings) {
            await game.settings.set(MODULE_ID, "autorecVersion", moduleVersion);
        }
    }
}

export const autoanimationsAdapter = new AutoanimationsModuleAdapter();

export function createAutorecEntry(key, trigger, animation, config, version = "0.0.0", fallback = key) {
    return autoanimationsAdapter.createAutorecEntry(key, trigger, animation, config, version, fallback);
}

export function register(key, trigger, animation, config, version = "0.0.0", fallback = key, options = {}) {
    return autoanimationsAdapter.register(key, trigger, animation, config, version, fallback, options);
}

export function submit() {
    return autoanimationsAdapter.submit();
}

// Direct API alias object for backward compatibility
export const autoanimations = {
    register,
    submit,
    createAutorecEntry,
    standardizeTrigger
};
