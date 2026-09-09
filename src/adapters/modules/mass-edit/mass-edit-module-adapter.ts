import { BaseModuleAdapter } from "../base-module-adapter.js";
import { log } from "../../../lib/logger.js";

/**
 * Baileywiki Mass Edit (multi-token-edit) Module Adapter.
 * Encapsulates placeable linking and element attachment via Mass Edit's Linker API.
 */
export class MassEditModuleAdapter extends BaseModuleAdapter {
    /**
     * @param {string} [moduleId='multi-token-edit'] Unique module identifier
     */
    constructor(moduleId = 'multi-token-edit') {
        super(moduleId);
    }

    /**
     * Access the active MassEdit Linker API instance.
     */
    get linker(): any {
        return (globalThis as any).MassEdit?.linker;
    }

    /**
     * Links elements to a target PlaceableObject (Token, Tile, etc.).
     * @param {Array<PlaceableObject>|PlaceableObject} elements Elements to link
     * @param {PlaceableObject} target Target parent placeable
     * @returns {Promise<unknown>}
     */
    async link(elements: any, target: any): Promise<any> {
        const items = [elements].flat().filter(Boolean);
        if (items.length === 0 || !target) return;
        const linker = this.linker;
        if (!linker?.link) {
            log.warn("MassEditModuleAdapter.link | MassEdit linker API is unavailable.");
            return;
        }
        return Promise.all(items.map((element: any) => linker.link([element, target])));
    }

    /**
     * Removes link connections between elements and a target PlaceableObject.
     * @param {Array<PlaceableObject>|PlaceableObject} elements Elements to unlink
     * @param {PlaceableObject} target Target parent placeable
     * @returns {Promise<unknown>}
     */
    async removeLinks(elements: any, target: any): Promise<any> {
        const items = [elements].flat().filter(Boolean);
        if (items.length === 0 || !target) return;
        const linker = this.linker;
        if (!linker?.removeLinks) {
            log.warn("MassEditModuleAdapter.removeLinks | MassEdit linker API is unavailable.");
            return;
        }
        return Promise.all(items.map((element: any) => linker.removeLinks([element, target])));
    }

    /**
     * Alias for link.
     */
    async attach(elements: any, target: any): Promise<any> {
        return this.link(elements, target);
    }

    /**
     * Alias for removeLinks.
     */
    async detach(elements: any, target: any): Promise<any> {
        return this.removeLinks(elements, target);
    }
}

export const massEditAdapter = new MassEditModuleAdapter();

export const massEdit = {
    link: (elements: any, target: any) => massEditAdapter.link(elements, target),
    removeLinks: (elements: any, target: any) => massEditAdapter.removeLinks(elements, target),
    attach: (elements: any, target: any) => massEditAdapter.attach(elements, target),
    detach: (elements: any, target: any) => massEditAdapter.detach(elements, target),
    get linker() {
        return massEditAdapter.linker;
    }
};
