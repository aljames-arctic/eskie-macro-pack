import { parseAndNormalizeAbility } from './helper.js';
import { BaseFoundryAdapter } from '../foundry/base-foundry-adapter.js';

/**
 * Base System Adapter Class
 * Defines the polymorphic interface and shared normalization routines for all system adapters.
 */
export class BaseSystemAdapter {
    systemId: string;
    id: string;
    isSupported: boolean;
    foundry: BaseFoundryAdapter;

    /**
     * @param {string} systemId System identifier (e.g. 'dnd5e', 'pf2e', 'generic')
     * @param {boolean} [isSupported=false] Whether this system has dedicated adapter support
     * @param {BaseFoundryAdapter} [foundry=null] Active Foundry platform adapter
     */
    constructor(systemId: string, isSupported: boolean = false, foundry: BaseFoundryAdapter | null = null) {
        if (foundry && !(foundry instanceof BaseFoundryAdapter)) {
            throw new Error(`BaseSystemAdapter requires a valid BaseFoundryAdapter instance, received: ${foundry}`);
        }
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
    isNewerVersion(a: string, b: string): boolean {
        return this.foundry.isNewerVersion(a, b);
    }

    /**
     * Enrich an HTML string using the Foundry platform adapter.
     * @param {string} content HTML string to enrich
     * @param {Object} [options={}] Enrichment options
     * @returns {Promise<string>}
     */
    async enrichHTML(content: string, options: any = {}): Promise<string> {
        return this.foundry.enrichHTML(content, options);
    }

    /**
     * Safely resolve a document from UUID synchronously using the Foundry platform adapter.
     * @param {string} uuid Document UUID
     * @param {Object} [options={}] Resolution options
     * @returns {Document|null}
     */
    fromUuidSync(uuid: string, options: any = {}): any {
        return this.foundry.fromUuidSync(uuid, options);
    }

    /**
     * Safely resolve a document from UUID asynchronously using the Foundry platform adapter.
     * @param {string} uuid Document UUID
     * @param {Object} [options={}] Resolution options
     * @returns {Promise<Document|null>}
     */
    async fromUuid(uuid: string, options: any = {}): Promise<any> {
        return this.foundry.fromUuid(uuid, options);
    }

    /**
     * Merge two objects recursively using the Foundry platform adapter.
     * @param {Object} original Target object
     * @param {Object} [other={}] Source object
     * @param {Object} [options={}] Merge options
     * @returns {Object}
     */
    mergeObject(original: any, other: any = {}, options: any = {}): any {
        return this.foundry.mergeObject(original, other, options);
    }

    /**
     * Deep duplicate an object using the Foundry platform adapter.
     * @param {Object} obj Target object
     * @returns {Object}
     */
    duplicate(obj: any): any {
        return this.foundry.duplicate(obj);
    }

    /**
     * Deep clone an object using the Foundry platform adapter.
     * @param {Object} obj Target object
     * @returns {Object}
     */
    deepClone(obj: any): any {
        return this.foundry.deepClone(obj);
    }

    /**
     * Retrieve a property from an object by dot path using the Foundry platform adapter.
     * @param {Object} obj Target object
     * @param {string} path Dot path
     * @returns {*}
     */
    getProperty(obj: any, path: string): any {
        return this.foundry.getProperty(obj, path);
    }

    /**
     * Set a property on an object by dot path using the Foundry platform adapter.
     * @param {Object} obj Target object
     * @param {string} path Dot path
     * @param {*} value Property value
     * @returns {boolean}
     */
    setProperty(obj: any, path: string, value: any): boolean {
        return this.foundry.setProperty(obj, path, value);
    }

    /**
     * Generate a random string identifier using the Foundry platform adapter.
     * @param {number} [length=16] Length of the identifier
     * @returns {string}
     */
    randomID(length: number = 16): string {
        return this.foundry.randomID(length);
    }

    /**
     * Test whether an object is empty using the Foundry platform adapter.
     * @param {Object} obj Target object
     * @returns {boolean}
     */
    isEmpty(obj: any): boolean {
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
    qualifyMessage(message: any): string {
        const hasRolls = Boolean((message?.rolls && message.rolls.length > 0) || message?.roll);
        if (!hasRolls) return "text";
        return "unknown";
    }

    /**
     * Extracts raw roll results from a chat message.
     * @param {ChatMessage} message The chat message document to inspect
     * @returns {Array<{ source: string, rawAbility: string|null, outcome: string, tokenId: string|null }>} List of rolls
     */
    extractRolls(message: any): any[] {
        return [];
    }

    /**
     * Normalizes a system-specific ability string using base and custom mappings.
     * @param {string|null} rawAbility The raw ability string
     * @param {string} [combinedText=""] Combined flavor and content text
     * @param {Record<string, string>} [customMap={}] Custom map
     * @returns {string|null}
     */
    normalizeAbility(rawAbility: any, combinedText: string = "", customMap: Record<string, string> = {}): string | null {
        return parseAndNormalizeAbility(rawAbility, combinedText, customMap);
    }

    /**
     * Retrieve the spell level for an item or animation handler.
     * @param {Object} config Configuration containing aaHandler or item
     * @returns {number|undefined}
     */
    getSpellLevel(config: any = {}): number | undefined {
        return config?.aaHandler?.systemData?.spellLevel ?? config?.item?.system?.level ?? undefined;
    }

    /**
     * Retrieve normalized creature type string for a target actor.
     * @param {Actor} actor Concrete Actor document
     * @returns {string|null}
     */
    getCreatureType(actor: any): string | null {
        if (!actor) return null;
        const rawType = actor.system?.details?.type?.value ?? actor.system?.details?.type ?? null;
        return typeof rawType === 'string' ? rawType : null;
    }
}
