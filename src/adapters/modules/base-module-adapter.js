/**
 * Base class for all third-party module adapters.
 * Encapsulates module-specific logic, roll extraction, and feature detection.
 */
export class BaseModuleAdapter {
    /**
     * @param {string} moduleId Unique module identifier
     */
    constructor(moduleId) {
        this.moduleId = moduleId;
    }

    /**
     * Whether the module is active in the current world.
     * @returns {boolean}
     */
    isActive() {
        return Boolean(game?.modules?.get(this.moduleId)?.active);
    }

    /**
     * Extracts raw rolls or outcomes from a chat message.
     * @param {ChatMessage} message The chat message document to inspect
     * @returns {{ rolls: Array<{ source: string, rawAbility: string|null, outcome: string, tokenId: string|null }>, outcome: string }}
     */
    extractRolls(message) {
        return { rolls: [], outcome: "indeterminant" };
    }
}
