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
    get linker() {
        return MassEdit?.linker;
    }

    /**
     * Links elements to a target PlaceableObject (Token, Tile, etc.).
     * @param {Array<PlaceableObject|Document>|PlaceableObject|Document} elements Elements to link
     * @param {PlaceableObject|Document} target Target parent object
     * @returns {Promise<unknown>}
     */
    async link(elements, target) {
        const items = [elements].flat().filter(Boolean);
        if (items.length === 0 || !target) return;
        const linker = this.linker;
        if (!linker?.link) {
            log.warn("MassEditModuleAdapter.link | MassEdit linker API is unavailable.");
            return;
        }
        return Promise.all(items.map(element => linker.link([element, target])));
    }

    /**
     * Removes link connections between elements and a target PlaceableObject.
     * @param {Array<PlaceableObject|Document>|PlaceableObject|Document} elements Elements to unlink
     * @param {PlaceableObject|Document} target Target parent object
     * @returns {Promise<unknown>}
     */
    async removeLinks(elements, target) {
        const items = [elements].flat().filter(Boolean);
        if (items.length === 0 || !target) return;
        const linker = this.linker;
        if (!linker?.removeLinks) {
            log.warn("MassEditModuleAdapter.removeLinks | MassEdit linker API is unavailable.");
            return;
        }
        return Promise.all(items.map(element => linker.removeLinks([element, target])));
    }

    /**
     * Alias for link.
     */
    async attach(elements, target) {
        return this.link(elements, target);
    }

    /**
     * Alias for removeLinks.
     */
    async detach(elements, target) {
        return this.removeLinks(elements, target);
    }
}

export const massEditAdapter = new MassEditModuleAdapter();

export const massEdit = {
    link: (elements, target) => massEditAdapter.link(elements, target),
    removeLinks: (elements, target) => massEditAdapter.removeLinks(elements, target),
    attach: (elements, target) => massEditAdapter.attach(elements, target),
    detach: (elements, target) => massEditAdapter.detach(elements, target),
    get linker() {
        return massEditAdapter.linker;
    }
};
