import { BaseSystemAdapter } from './base-system-adapter.js';

/**
 * Pathfinder 2e (PF2e) System Adapter Class
 * Supports PF2e ruleset roll flags and degrees of success context.
 */
export class Pf2eSystemAdapter extends BaseSystemAdapter {
    /**
     * @param {BaseFoundryAdapter} [foundry=null]
     */
    constructor(foundry = null) {
        super("pf2e", true, foundry);
    }

    /**
     * Semantically qualifies a chat message for PF2e.
     * @param {ChatMessage} message
     * @returns {string}
     */
    qualifyMessage(message) {
        const pf2eContext = message?.flags?.pf2e?.context;
        if (pf2eContext) {
            const type = pf2eContext.type;
            if (type === "saving-throw") return "saving throw";
            if (type === "skill-check" || type === "perception-check" || type === "ability-check") return "ability check";
            if (type === "attack-roll") return "attack";
        }
        return super.qualifyMessage(message);
    }

    /**
     * Extracts raw roll results from a PF2e chat message.
     * @param {ChatMessage} message
     * @returns {Array<{ source: string, rawAbility: string|null, outcome: string, tokenId: string|null }>}
     */
    extractRolls(message) {
        const rolls = [];
        const pf2eContext = message?.flags?.pf2e?.context;
        const pf2eFlags = message?.flags?.pf2e;

        if (pf2eContext) {
            let outcome = "indeterminant";
            const pf2eOutcome = pf2eContext.outcome; // 'success', 'criticalSuccess', 'failure', 'criticalFailure'

            if (pf2eOutcome) {
                if (pf2eOutcome === "success" || pf2eOutcome === "criticalSuccess") outcome = "success";
                if (pf2eOutcome === "failure" || pf2eOutcome === "criticalFailure") outcome = "failure";
            }

            // Extract ability robustly: first from context, then from modifiers list, and finally fallback to modifierName
            let rawAbility = pf2eContext.ability ?? null;
            if (!rawAbility && pf2eFlags) {
                const abilityModifier = pf2eFlags.modifiers?.find(m => m.type === "ability");
                if (abilityModifier) {
                    rawAbility = abilityModifier.ability ?? null; // e.g., 'con', 'dex', 'wis'
                } else {
                    rawAbility = pf2eFlags.modifierName ?? null; // e.g., 'fortitude', 'reflex', 'will'
                }
            }

            rolls.push({
                source: "pf2e-flags",
                rawAbility: rawAbility,
                outcome: outcome,
                tokenId: message?.speaker?.token ?? null
            });
        }

        return rolls;
    }

    /**
     * Normalizes a PF2e ability or save/skill code into a standard ability name.
     * @param {string|null} rawAbility
     * @param {string} [combinedText=""]
     * @returns {string|null}
     */
    normalizeAbility(rawAbility, combinedText = "") {
        const pf2eMap = {
            perception: "wisdom", prc: "wisdom",
            fortitude: "constitution",
            reflex: "dexterity",
            will: "wisdom"
        };
        return super.normalizeAbility(rawAbility, combinedText, pf2eMap);
    }

    /**
     * Retrieve the spell level for an item in PF2e.
     * @param {Object} config
     * @returns {number|undefined}
     */
    getSpellLevel(config = {}) {
        return config?.item?.system?.level?.value ?? undefined;
    }

    /**
     * Retrieve normalized creature type string for a target actor in PF2e.
     * @param {Actor} actor
     * @returns {string|null}
     */
    getCreatureType(actor) {
        if (!actor) return null;
        const rawType = actor.system?.details?.creatureType ?? actor.system?.traits?.value?.[0] ?? null;
        return typeof rawType === 'string' ? rawType.toLowerCase() : null;
    }
}
