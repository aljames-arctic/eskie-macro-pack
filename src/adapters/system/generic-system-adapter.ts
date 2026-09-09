import { BaseSystemAdapter } from './base-system-adapter.js';

/**
 * Generic Fallback System Adapter Class
 * Resolves rolls using regex keyword scans (ideal for PF1e, D&D 3.5, unsupported d20 systems, etc.)
 */
export class GenericSystemAdapter extends BaseSystemAdapter {
    /**
     * @param {BaseFoundryAdapter} [foundry=null]
     */
    constructor(foundry = null) {
        super("generic", false, foundry);
    }

    /**
     * Semantically qualifies a chat message using regex keyword analysis.
     * @param {ChatMessage} message
     * @returns {string}
     */
    qualifyMessage(message) {
        const flavorText = (message?.flavor ?? "").toLowerCase();
        const contentText = message?.content ?? "";
        const contentLower = contentText.toLowerCase();
        const combinedText = `${flavorText} ${contentLower}`;

        const hasKeywords = /save|saving\s+throw|check|skill/.test(combinedText);
        const isAttackOrDamage = /attack|strike|damage|damage\s+roll/.test(combinedText);
        const hasRolls = Boolean((message?.rolls && message.rolls.length > 0) || message?.roll);

        if (hasRolls && !isAttackOrDamage && hasKeywords) {
            if (/save|saving\s+throw/.test(combinedText)) return "saving throw";
            if (/check|skill/.test(combinedText)) return "ability check";
        }

        return super.qualifyMessage(message);
    }

    /**
     * Extracts generic roll results from a qualified chat message.
     * @param {ChatMessage} _message
     * @returns {Array<{ source: string, rawAbility: string|null, outcome: string, tokenId: string|null }>}
     */
    extractRolls(_message) {
        return [{
            source: "generic-keywords",
            rawAbility: null,
            outcome: "indeterminant",
            tokenId: null
        }];
    }
}
