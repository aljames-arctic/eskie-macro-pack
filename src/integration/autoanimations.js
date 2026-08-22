import { MODULE_ID } from "../lib/constants.js";
import { dependency } from "../lib/dependency.js";
import { defaultMenuSettings } from "./autoanimations/defaultMenuSettings.js";
import { autorecUpdateFormApplication, generateAutorecUpdate } from "./autoanimations/updateMenu.js";
import { blfx } from "./blfx.js";
import { log } from '../lib/logger.js';
import { localize, format } from "../lib/utils.js";

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

// Standardize trigger names to match AA expected values
// Useful because I won't remember templatefx vs template, aefx vs effect, etc.
function standardizeTrigger(trigger) {
    trigger = trigger.toLowerCase();
    switch(trigger) {
        case "ontoken":
        case "token": return "ontoken";

        case "templatefx":
        case "template": return "templatefx";

        case "aura": return "aura";

        case "aefx":
        case "effect": return "aefx";

        case "melee":
        case "melee-target": return "melee";

        case "range":
        case "ranged-target": return "range";
        default: throw (`EMP + AA | Unknown trigger type "${trigger}"`);
    }
}

/**
 * Creates a template for an Automated Animations autorec entry formatted for Eskie Macro Pack use case.
 * @param {string} label - The name of the spell/item.
 * @param {string} macroName - The name of the globally exposed wrapper function.
 * @returns {object} The autorec entry.
 */
function createAutorecEntry(key, trigger, animation, config, version = "0.0.0", fallback = key) {
    trigger = standardizeTrigger(trigger);
    const defaultMenu = defaultMenuSettings[trigger];
    const defaultEntry = defaultMenu[0];
    const compendium = `Compendium.${MODULE_ID}.eskie-aa-integration`;

    const localizedLabel = (key.includes(":") || key.includes(" ")) ? key : localize(`EMP.effects.${key}`, fallback);

    let name = "UNSPECIFIED MACRO";
    switch(trigger) {
        case "ontoken":
            /* play(token, config) */
            name = `${compendium}.AA | Token`;
            break;
        case "melee":
        case "range":
            /* play(token, target, config) */
            name = `${compendium}.AA | Target`;
            break;
        case "aefx":
            /* play(token, config) */
            name = `${compendium}.AA | Effect`;
            break;
        case "aura":
        case "templatefx":
            /* play(token, config) */
            name = `${compendium}.AA | Template`;
            break;
        case "preset":
            /* unused */
            break;
        default:
            throw new Error(`EMP + AA | Unknown trigger type "${trigger}" for effect "${name}".`);
    }
    config.animation = animation;

    const entry = {
        id: foundry.utils.randomID(),
        label: localizedLabel,
        macro: {
            enable: true,
            name: name,
            args: JSONformatObject(config),
            playWhen: "2"
        },
        metaData: {
            label: localizedLabel,
            menu: trigger,
            name: "Eskie Macro Pack",
            version: version
        }
    };

    return foundry.utils.mergeObject(defaultEntry, entry, { inplace: false });
}

// Convert object to stringified JSON and escape quotes
// For instance: { key: "value" } -> "{ "key": \"value\"}"
function JSONformatObject(obj, depth = 1) {
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    var type = typeof obj;
    /* Special case for eskie.effect and eskie.mask functions */
    if(type === 'string' && (obj.startsWith("eskie.effect.") || obj.startsWith("eskie.mask."))) return obj;
    /* Better looking JSON stringify */
    if(type === 'string') return '\'' + obj + '\'';
    if(type === 'boolean' || type === 'number') return obj;
    if(type === 'function') return obj.toString();
    if(obj instanceof Array) return JSON.stringify(obj);

    var ret = [];
    for(var prop in obj) {
      ret.push(`\n` + ' '.repeat(depth * 2) +`${prop}: ${JSONformatObject(obj[prop], depth + 1)}`);
    }
    return `{${ret.join(',')}\n}`;
}

/**
 * Registers an animation entry internally, without immediately submitting it to Automated Animations.
 * These registered animations are stored and can be submitted later using the `submit` function.
 * @param {string} name - The name of the animation.
 * @param {string} trigger - The trigger type for the animation
 *      Valid Triggers:
 *          - "token" : Self targetting ability
 *          - "template" : Template using ability (may require accompanying aefx CONCENTRATION)
 *          - "effect" : Active effect applied
 *          - "melee-target" : Source -> Target melee animation
 *          - "ranged-target" : Source -> Target ranged animation
 * @param {string} animation - The animation to be played.
 * @param {object} config - Configuration object for the animation.
 * @param {string} version - The version of the animation entry.
 * @returns {void}
 */
async function register(key, trigger, animation, config, version = "0.0.0", fallback = key, options = {}) {
    const stdTrigger = standardizeTrigger(trigger);
    const entry = createAutorecEntry(key, stdTrigger, animation, config, version, fallback);
    if (entry) {
        EMP_AA_Menu[stdTrigger].push(entry);
    }
    blfx.register(key, trigger, animation, config, version, fallback, options);
}

/**
 * Submits all internally registered animations to Automated Animations.
 * This function checks for the "autoanimations" dependency and then generates
 * and displays an update form if there are missing, updated, or custom entries.
 * @returns {Promise<void>}
 */
async function submit() {
    if (!game.user.isGM) return;
    const developmentVersion = "#{VERSION}#";
    const moduleVersion = game.modules.get(MODULE_ID).version;
    const lastUpdate = game.settings.get(MODULE_ID, "autorecVersion");
    const shouldUpdate = moduleVersion == developmentVersion || foundry.utils.isNewerVersion(moduleVersion, lastUpdate);
    if (!shouldUpdate) return;

    if (!dependency.isActivated({ id: "autoanimations", min: "6.5.1" }, localize("EMP.autoanimations.skipped", "EMP | Automated Animations integration skipped."))) { return; }
    const { missingEntriesList, updatedEntriesList, customEntriesList } = await generateAutorecUpdate(EMP_AA_Menu);
    if (missingEntriesList.length || updatedEntriesList.length || customEntriesList.length) {
        new autorecUpdateFormApplication(EMP_AA_Menu).render(true);
    } else {
        log.info(localize("EMP.updateMenu.nothing", "All Eskie Macro Pack animations are up to date!"));
    }

    if (moduleVersion != developmentVersion)
        game.settings.set(MODULE_ID, "autorecVersion", moduleVersion);
}

export const autoanimations = {
    register,
    submit,
};

export function CONCENTRATING(key, fallback = key) {
    const localizedName = (key.includes(":") || key.includes(" ")) ? key : localize(`EMP.effects.${key}`, fallback);
    return format("EMP.effects.concentratingPrefix", { name: localizedName }, `Concentrating: ${localizedName}`);
}