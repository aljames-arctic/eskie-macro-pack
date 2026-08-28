import { parseAndNormalizeAbility } from './helper.js';
import { BaseFoundryAdapter } from '../foundry/base-foundry-adapter.js';

/**
 * Base System Adapter Class
 * Defines the polymorphic interface and shared normalization routines for all system adapters.
 */
export class BaseSystemAdapter {
    /**
     * @param {string} systemId System identifier (e.g. 'dnd5e', 'pf2e', 'generic')
     * @param {boolean} [isSupported=false] Whether this system has dedicated adapter support
     * @param {BaseFoundryAdapter} [foundry=null] Active Foundry platform adapter
     */
    constructor(systemId, isSupported = false, foundry = null) {
        this.systemId = systemId;
        this.id = systemId; // Backward-compatibility alias
        this.isSupported = Boolean(isSupported);
        this.foundry = foundry ?? new BaseFoundryAdapter();
    }

    /**
     * Test whether version a is strictly newer than version b using the Foundry platform adapter.
     * @param {string} a Primary version string
     * @param {string} b Target version string to compare against
     * @returns {boolean}
     */
    isNewerVersion(a, b) {
        return this.foundry.isNewerVersion(a, b);
    }

    /**
     * Enrich an HTML string using the Foundry platform adapter.
     * @param {string} content HTML string to enrich
     * @param {Object} [options={}] Enrichment options
     * @returns {Promise<string>}
     */
    async enrichHTML(content, options = {}) {
        return this.foundry.enrichHTML(content, options);
    }

    /**
     * Safely resolve a document from UUID synchronously using the Foundry platform adapter.
     * @param {string} uuid Document UUID
     * @param {Object} [options={}] Resolution options
     * @returns {Document|null}
     */
    fromUuidSync(uuid, options = {}) {
        return this.foundry.fromUuidSync(uuid, options);
    }

    /**
     * Safely resolve a document from UUID asynchronously using the Foundry platform adapter.
     * @param {string} uuid Document UUID
     * @param {Object} [options={}] Resolution options
     * @returns {Promise<Document|null>}
     */
    async fromUuid(uuid, options = {}) {
        return this.foundry.fromUuid(uuid, options);
    }

    /**
     * Merge two objects recursively using the Foundry platform adapter.
     * @param {Object} original Target object
     * @param {Object} [other={}] Source object
     * @param {Object} [options={}] Merge options
     * @returns {Object}
     */
    mergeObject(original, other = {}, options = {}) {
        return this.foundry.mergeObject(original, other, options);
    }

    /**
     * Deep duplicate an object using the Foundry platform adapter.
     * @param {Object} obj Target object
     * @returns {Object}
     */
    duplicate(obj) {
        return this.foundry.duplicate(obj);
    }

    /**
     * Deep clone an object using the Foundry platform adapter.
     * @param {Object} obj Target object
     * @returns {Object}
     */
    deepClone(obj) {
        return this.foundry.deepClone(obj);
    }

    /**
     * Retrieve a property from an object by dot path using the Foundry platform adapter.
     * @param {Object} obj Target object
     * @param {string} path Dot path
     * @returns {*}
     */
    getProperty(obj, path) {
        return this.foundry.getProperty(obj, path);
    }

    /**
     * Set a property on an object by dot path using the Foundry platform adapter.
     * @param {Object} obj Target object
     * @param {string} path Dot path
     * @param {*} value Property value
     * @returns {boolean}
     */
    setProperty(obj, path, value) {
        return this.foundry.setProperty(obj, path, value);
    }

    /**
     * Generate a random string identifier using the Foundry platform adapter.
     * @param {number} [length=16] Length of the identifier
     * @returns {string}
     */
    randomID(length = 16) {
        return this.foundry.randomID(length);
    }

    /**
     * Test whether an object is empty using the Foundry platform adapter.
     * @param {Object} obj Target object
     * @returns {boolean}
     */
    isEmpty(obj) {
        return this.foundry.isEmpty(obj);
    }

    /* -------------------------------------------- */
    /*  Message Classification & Roll Parsing       */
    /* -------------------------------------------- */

    /**
     * Semantically classifies a chat message to determine its purpose.
     * Returns a string representing the type: "saving throw", "ability check", "attack", "damage", "item description", "text", or "unknown".
     * @param {ChatMessage} message The chat message document to inspect
     * @returns {string} The message classification.
     */
    qualifyMessage(message) {
        const hasRolls = Boolean((message?.rolls && message.rolls.length > 0) || message?.roll);
        if (!hasRolls) return "text";
        return "unknown";
    }

    /**
     * Extracts raw roll results from a chat message.
     * @param {ChatMessage} message The chat message document to inspect
     * @returns {Array<{ source: string, rawAbility: string|null, outcome: string, tokenId: string|null }>} List of rolls
     */
    extractRolls(message) {
        return [];
    }

    /**
     * Normalizes a system-specific ability string using base and custom mappings.
     * @param {string|null} rawAbility The raw ability string
     * @param {string} [combinedText=""] Combined flavor and content text
     * @param {Record<string, string>} [customMap={}] Custom map
     * @returns {string|null}
     */
    normalizeAbility(rawAbility, combinedText = "", customMap = {}) {
        return parseAndNormalizeAbility(rawAbility, combinedText, customMap);
    }

    /**
     * Retrieve the spell level for an item or animation handler.
     * @param {Object} config Configuration containing aaHandler or item
     * @returns {number|undefined}
     */
    getSpellLevel(config = {}) {
        return config?.aaHandler?.systemData?.spellLevel ?? config?.item?.system?.level ?? undefined;
    }

    /**
     * Retrieve normalized creature type string for a target actor.
     * @param {Actor} actor Concrete Actor document
     * @returns {string|null}
     */
    getCreatureType(actor) {
        if (!actor) return null;
        const rawType = actor.system?.details?.type?.value ?? actor.system?.details?.type ?? null;
        return typeof rawType === 'string' ? rawType : null;
    }
}
