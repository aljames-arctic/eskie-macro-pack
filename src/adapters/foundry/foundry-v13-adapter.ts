import { FoundryV12Adapter } from './foundry-v12-adapter.js';

/**
 * Foundry VTT V13 platform adapter.
 * Extends FoundryV12Adapter and encapsulates capabilities and API changes introduced in Foundry V13,
 * including namespaced constructors, modern UUID resolution, and plural combatant lookup.
 */
export class FoundryV13Adapter extends FoundryV12Adapter {
    /**
     * The active ContextMenu constructor in v13+.
     */
    get ContextMenu(): any {
        return foundry.applications.ux.ContextMenu.implementation;
    }

    /**
     * The active KeyboardManager constructor in v13+.
     */
    get KeyboardManager(): any {
        return (foundry.helpers as any)?.interaction?.KeyboardManager?.implementation ?? KeyboardManager;
    }

    /**
     * The active Token placeable constructor in v13+.
     */
    get Token(): any {
        return foundry.canvas.placeables.Token.implementation;
    }

    /**
     * The active Tile placeable constructor in v13+.
     */
    get Tile(): any {
        return foundry.canvas.placeables.Tile.implementation;
    }

    /**
     * The active FilePicker constructor / implementation in v13+.
     */
    get FilePicker(): any {
        return foundry.applications.apps.FilePicker.implementation;
    }

    /**
     * The active TextEditor constructor / implementation in v13+.
     */
    get TextEditor(): any {
        return foundry.applications.ux.TextEditor.implementation;
    }

    /**
     * Safely resolve a document from UUID synchronously using standard V13+ foundry.utils.fromUuidSync.
     * @param {string} uuid Document UUID
     * @param {Object} [options={}] Resolution options
     * @returns {Document|null}
     */
    fromUuidSync(uuid: string, options: any = {}): any {
        return foundry.utils.fromUuidSync(uuid, options);
    }

    /**
     * Safely resolve a document from UUID asynchronously using standard V13+ foundry.utils.fromUuid.
     * @param {string} uuid Document UUID
     * @param {Object} [options={}] Resolution options
     * @returns {Promise<Document|null>}
     */
    async fromUuid(uuid: string, options: any = {}): Promise<any> {
        return foundry.utils.fromUuid(uuid, options);
    }

    /**
     * Retrieve all combatants associated with a token in combat using native V13+ Combat#getCombatantsByToken.
     * @param {Combat} combat Target combat encounter
     * @param {Token} token Target Token placeable
     * @returns {Combatant[]}
     */
    getCombatantsByToken(combat: any, token: any): any[] {
        if (!combat || !token) return [];
        return (combat as any).getCombatantsByToken(token);
    }

    /**
     * Preload Handlebars templates in Foundry V13+ using namespaced foundry.applications.handlebars.loadTemplates.
     * @override
     * @param {string[]} paths Array of template paths
     * @returns {Promise<Function[]>}
     */
    async loadTemplates(paths: string[]): Promise<any> {
        return foundry.applications.handlebars.loadTemplates(paths);
    }
}
