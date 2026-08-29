/**
 * Base class for all third-party module adapters.
 * Encapsulates module-specific logic, roll extraction, and feature detection.
 */
export class BaseModuleAdapter {
    /**
     * @param {string} moduleId Unique module identifier
     * @param {object} [foundryAdapter=null] Optional foundry adapter instance
     */
    constructor(moduleId, foundryAdapter = null) {
        this.moduleId = moduleId;
        this._foundry = foundryAdapter;
    }

    /**
     * Platform adapter instance.
     * @returns {object}
     */
    get foundry() {
        if (this._foundry) return this._foundry;
        if (typeof globalThis.eskie !== 'undefined' && globalThis.eskie?.adapter) {
            return globalThis.eskie.adapter;
        }
        return {
            randomID: (len) => (typeof foundry !== 'undefined' && foundry.utils?.randomID ? foundry.utils.randomID(len) : Math.random().toString(36).substring(2, 18)),
            mergeObject: (original, other, options = {}) => (typeof foundry !== 'undefined' && foundry.utils?.mergeObject
                ? foundry.utils.mergeObject(original, other, { inplace: false, ...options })
                : Object.assign({}, original, other)),
            deepClone: (obj) => (typeof foundry !== 'undefined' && foundry.utils?.deepClone
                ? foundry.utils.deepClone(obj)
                : (typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj)))),
            isNewerVersion: (a, b) => (typeof foundry !== 'undefined' && foundry.utils?.isNewerVersion ? foundry.utils.isNewerVersion(a, b) : false)
        };
    }

    set foundry(adapter) {
        this._foundry = adapter;
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
