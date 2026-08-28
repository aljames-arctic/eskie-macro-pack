import { BaseSystemAdapter } from './base-system-adapter.js';
import { midiQolAdapter } from '../modules/midi-qol/midi-qol-module-adapter.js';
import { log } from '../../lib/logger.js';

/**
 * D&D 5e System Adapter Class
 * Supports core D&D 5e rolls, flags, spell contracts, creature types, and handles Midi-QOL automation via its module adapter.
 */
export class Dnd5eSystemAdapter extends BaseSystemAdapter {
    /**
     * @param {BaseFoundryAdapter} [foundry=null]
     */
    constructor(foundry = null) {
        super("dnd5e", true, foundry);
    }

    /**
     * Semantically qualifies a chat message for D&D 5e.
     * @param {ChatMessage} message
     * @returns {string}
     */
    qualifyMessage(message) {
        log.debug(`Dnd5eSystemAdapter.qualifyMessage: message="${message?.id}"`, {
            rollType: message?.flags?.dnd5e?.roll?.type,
            messageType: message?.flags?.dnd5e?.messageType,
            midiMessageType: message?.flags?.["midi-qol"]?.messageType,
            midiType: message?.flags?.["midi-qol"]?.type,
            flavor: message?.flavor
        });

        // 1. Midi-QOL Saves Display HTML Check (High Priority)
        if (midiQolAdapter.isActive()) {
            const contentText = message?.content ?? "";
            if (contentText.includes("midi-qol") && contentText.includes("midi-qol-saves-display")) {
                return "saving throw";
            }
        }

        // 2. Core D&D 5e Roll Flags
        const rollFlags = message?.flags?.dnd5e?.roll;
        if (rollFlags) {
            if (rollFlags.type === "save") return "saving throw";
            if (rollFlags.type === "ability" || rollFlags.type === "skill") return "ability check";
            if (rollFlags.type === "attack") return "attack";
            if (rollFlags.type === "damage") return "damage";
        }

        // 3. Core Item Usage
        if (message?.flags?.dnd5e?.messageType === "usage") return "item description";

        // 4. Midi-QOL Flags
        if (midiQolAdapter.isActive()) {
            const midiFlags = message?.flags?.["midi-qol"];
            const messageType = midiFlags?.messageType ?? midiFlags?.type;
            if (messageType) {
                if (messageType === "save") return "saving throw";
                if (messageType === "check") return "ability check";
                if (messageType === "attack") return "attack";
                if (messageType === "damage") return "damage";
                if (messageType === "item") return "item description";
            }
        }

        // 5. Default Fallback
        return super.qualifyMessage(message);
    }

    /**
     * Extracts raw roll results from a D&D 5e chat message.
     * @param {ChatMessage} message
     * @returns {Array<{ source: string, rawAbility: string|null, outcome: string, tokenId: string|null }>}
     */
    extractRolls(message) {
        const rolls = [];

        // 1. Core System Flag Checks (rolls from character sheets)
        const rollFlags = message?.flags?.dnd5e?.roll;
        if (rollFlags) {
            rolls.push({
                source: "dnd5e-core-flags",
                rawAbility: rollFlags.ability ?? null,
                outcome: "indeterminant",
                tokenId: null
            });
        }

        // 2. Process Active Module Adapters (e.g. Midi-QOL)
        let moduleOutcome = "indeterminant";
        if (midiQolAdapter.isActive()) {
            const midiData = midiQolAdapter.extractRolls(message);
            if (midiData.rolls.length > 0) {
                rolls.push(...midiData.rolls);
            }
            moduleOutcome = midiData.outcome;
        }

        // Distribute module-level outcome to core/fallback rolls if they are still indeterminant
        rolls.forEach(roll => {
            if (roll.outcome === "indeterminant" && moduleOutcome !== "indeterminant") {
                roll.outcome = moduleOutcome;
            }
        });

        return rolls;
    }

    /**
     * Normalizes a D&D 5e ability or skill code into a standard ability name.
     * @param {string|null} rawAbility
     * @param {string} [combinedText=""]
     * @returns {string|null}
     */
    normalizeAbility(rawAbility, combinedText = "") {
        const dnd5eMap = {
            ath: "strength",
            acr: "dexterity", ste: "dexterity", sle: "dexterity",
            arc: "intelligence", his: "intelligence", inv: "intelligence", nat: "intelligence", rel: "intelligence",
            ani: "wisdom", ins: "wisdom", med: "wisdom", per: "wisdom", sur: "wisdom",
            dec: "charisma", itm: "charisma", prf: "charisma", pers: "charisma"
        };
        return super.normalizeAbility(rawAbility, combinedText, dnd5eMap);
    }

    /**
     * Retrieve the spell level for an item or animation handler in D&D 5e.
     * @param {Object} config Configuration containing aaHandler or item
     * @returns {number|undefined}
     */
    getSpellLevel(config = {}) {
        return config?.aaHandler?.systemData?.spellLevel ?? config?.item?.system?.level ?? undefined;
    }

    /**
     * Retrieve normalized creature type string for a target actor in D&D 5e.
     * @param {Actor} actor Concrete Actor document
     * @returns {string|null}
     */
    getCreatureType(actor) {
        if (!actor) return null;
        const rawType = actor.system?.details?.type?.value ?? actor.system?.details?.type ?? null;
        return typeof rawType === 'string' ? rawType.toLowerCase() : null;
    }
}
