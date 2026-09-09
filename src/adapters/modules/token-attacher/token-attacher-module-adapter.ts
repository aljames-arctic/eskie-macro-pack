import { BaseModuleAdapter } from "../base-module-adapter.js";
import { log } from "../../../lib/logger.js";

/**
 * Token Attacher (token-attacher) Module Adapter.
 * Encapsulates placeable and element attachment to tokens via Token Attacher API.
 */
export class TokenAttacherModuleAdapter extends BaseModuleAdapter {
    /**
     * @param {string} [moduleId='token-attacher'] Unique module identifier
     */
    constructor(moduleId = 'token-attacher') {
        super(moduleId);
    }

    /**
     * Access the active external tokenAttacher library API instance.
     */
    get api(): any {
        const globalTA = (globalThis as any).tokenAttacher;
        if (globalTA && globalTA !== tokenAttacher) {
            return globalTA;
        }
        return null;
    }

    /**
     * Attaches elements to a target Token.
     * @param {Array<PlaceableObject>|PlaceableObject} elements Elements to attach
     * @param {Token} targetToken Target token
     * @param {boolean} [suppressNotification=true] Whether to suppress UI notification
     * @returns {Promise<unknown>}
     */
    async attachElementsToToken(elements: any, targetToken: any, suppressNotification: boolean = true): Promise<any> {
        const items = [elements].flat().filter(Boolean);
        if (items.length === 0 || !targetToken) return;
        const api = this.api;
        if (!api?.attachElementsToToken) {
            log.warn("TokenAttacherModuleAdapter.attachElementsToToken | Token Attacher API is unavailable.");
            return;
        }
        return api.attachElementsToToken(items, targetToken, suppressNotification);
    }

    /**
     * Detaches elements from a target Token.
     * @param {Array<PlaceableObject>|PlaceableObject} elements Elements to detach
     * @param {Token} targetToken Target token
     * @param {boolean} [suppressNotification=true] Whether to suppress UI notification
     * @returns {Promise<unknown>}
     */
    async detachElementsFromToken(elements: any, targetToken: any, suppressNotification: boolean = true): Promise<any> {
        const items = [elements].flat().filter(Boolean);
        if (items.length === 0 || !targetToken) return;
        const api = this.api;
        if (!api?.detachElementsFromToken) {
            log.warn("TokenAttacherModuleAdapter.detachElementsFromToken | Token Attacher API is unavailable.");
            return;
        }
        return api.detachElementsFromToken(items, targetToken, suppressNotification);
    }

    /**
     * Alias for attachElementsToToken.
     */
    async attach(elements: any, targetToken: any, suppressNotification: boolean = true): Promise<any> {
        return this.attachElementsToToken(elements, targetToken, suppressNotification);
    }

    /**
     * Alias for detachElementsFromToken.
     */
    async detach(elements: any, targetToken: any, suppressNotification: boolean = true): Promise<any> {
        return this.detachElementsFromToken(elements, targetToken, suppressNotification);
    }
}

export const tokenAttacherAdapter = new TokenAttacherModuleAdapter();

export const tokenAttacher = {
    attachElementsToToken: (elements, targetToken, suppressNotification = true) =>
        tokenAttacherAdapter.attachElementsToToken(elements, targetToken, suppressNotification),
    detachElementsFromToken: (elements, targetToken, suppressNotification = true) =>
        tokenAttacherAdapter.detachElementsFromToken(elements, targetToken, suppressNotification),
    attach: (elements, targetToken, suppressNotification = true) =>
        tokenAttacherAdapter.attach(elements, targetToken, suppressNotification),
    detach: (elements, targetToken, suppressNotification = true) =>
        tokenAttacherAdapter.detach(elements, targetToken, suppressNotification),
    get api() {
        return tokenAttacherAdapter.api;
    }
};
