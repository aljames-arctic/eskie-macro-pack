import { BaseFoundryAdapter } from './base-foundry-adapter.js';

/**
 * Foundry VTT V12 platform baseline adapter.
 * Extends BaseFoundryAdapter and provides global constructors, legacy UUID resolution,
 * singular combatant lookup, top-left tile math, and -= deletion syntax for Foundry V12.
 */
export class FoundryV12Adapter extends BaseFoundryAdapter {
    /**
     * The active ContextMenu constructor in v12.
     */
    get ContextMenu() {
        return ContextMenu;
    }

    /**
     * The active KeyboardManager constructor in v12.
     */
    get KeyboardManager() {
        return KeyboardManager;
    }

    /**
     * The active Token placeable constructor in v12.
     */
    get Token() {
        return Token;
    }

    /**
     * The active Tile placeable constructor in v12.
     */
    get Tile() {
        return Tile;
    }

    /**
     * The active FilePicker constructor / implementation in v12.
     */
    get FilePicker() {
        return FilePicker;
    }

    /**
     * The active TextEditor constructor / implementation in v12.
     */
    get TextEditor() {
        return TextEditor;
    }

    /**
     * Safely resolve a document from UUID synchronously in Foundry V12.
     * @param {string} uuid Document UUID
     * @param {Object} [options={}] Resolution options
     * @returns {Document|null}
     */
    fromUuidSync(uuid, options = {}) {
        if (!uuid) return null;
        try {
            return fromUuidSync(uuid, options) ?? null;
        } catch (_) {
            return null;
        }
    }

    /**
     * Safely resolve a document from UUID asynchronously in Foundry V12.
     * @param {string} uuid Document UUID
     * @param {Object} [options={}] Resolution options
     * @returns {Promise<Document|null>}
     */
    async fromUuid(uuid, options = {}) {
        if (!uuid) return null;
        try {
            return (await fromUuid(uuid, options)) ?? null;
        } catch (_) {
            return null;
        }
    }

    /**
     * Retrieve all combatants associated with a token in combat using legacy V12 Combat#getCombatantByToken.
     * @param {Combat} combat Target combat encounter
     * @param {string|TokenDocument|Token} token Token ID or Document or Placeable
     * @returns {Combatant[]}
     */
    getCombatantsByToken(combat, token) {
        if (!combat) return [];
        const tokenId = token?.id ?? token?.document?.id ?? token;
        if (!tokenId) return [];

        const single = combat.getCombatantByToken?.(tokenId);
        return single ? [single] : [];
    }

    /* -------------------------------------------- */
    /*  Tile Anchor & Coordinate Math (V12)         */
    /* -------------------------------------------- */

    /**
     * Calculate reveal tile placement offset for Foundry V12 (legacy top-left anchor (0, 0)).
     * Compares token/tile size and scale to offset top-left origin.
     *
     * @param {PlaceableObject|Document} object Token or Tile object/document
     * @param {number} [scale=1] Additional scale multiplier
     * @returns {{x: number, y: number}} Offset coordinates
     */
    getRevealOffset(object, scale = 1) {
        if (!object) return { x: 0, y: 0 };
        const doc = object.document ?? object;
        const isToken = (doc.documentName === 'Token' || object.documentName === 'Token');
        const widthAdjustment = isToken ? (canvas?.grid?.size ?? 100) : 1;
        const scaleXY = doc.texture?.scaleX ?? 1;
        const totalScale = scaleXY * scale;
        const objX = object.x ?? doc.x ?? 0;
        const objY = object.y ?? doc.y ?? 0;
        const docWidth = doc.width ?? 1;
        const docHeight = doc.height ?? 1;

        return {
            x: objX - (widthAdjustment * docWidth * (totalScale - 1) / 2),
            y: objY - (widthAdjustment * docHeight * (totalScale - 1) / 2)
        };
    }

    /**
     * Calculate shape tile placement offset for Foundry V12 (legacy top-left anchor (0, 0)).
     *
     * @param {PlaceableObject|Document} object Token or Tile object/document
     * @returns {{x: number, y: number}} Offset coordinates
     */
    getShapeOffset(object) {
        if (!object) return { x: 0, y: 0 };
        const doc = object.document ?? object;
        return {
            x: object.x ?? doc.x ?? 0,
            y: object.y ?? doc.y ?? 0
        };
    }

    /* -------------------------------------------- */
    /*  Template Position Extraction (V12)          */
    /* -------------------------------------------- */

    /**
     * Gets position coordinates from a legacy MeasuredTemplate document or placeable.
     *
     * @param {Document|PlaceableObject} template The MeasuredTemplate document or placeable
     * @param {Object} [config={}] Configuration options
     * @returns {[ {x: number, y: number}, {x: number, y: number}, {x: number, y: number} ]} Array of [primary, secondary, center] coordinates
     */
    getTemplatePosition(template, config = {}) {
        if (!template || typeof template !== 'object') return [];

        const doc = template.document ?? template;
        const placeable = template.object ?? (template.document ? template : null);
        const farpoint = placeable?.ray?.B ?? doc.ray?.B;

        let primary = {
            x: doc.x ?? placeable?.x ?? 0,
            y: doc.y ?? placeable?.y ?? 0
        };

        const distance = (doc.distance !== undefined && doc.distance > 0)
            ? doc.distance
            : ((placeable?.distance !== undefined && placeable.distance > 0) ? placeable.distance : (config.distance ?? 0));
        const direction = doc.direction ?? placeable?.direction ?? config.direction ?? 0;
        const gridSize = canvas?.grid?.size ?? canvas?.dimensions?.size ?? 100;
        const gridDistance = canvas?.grid?.distance ?? canvas?.scene?.grid?.distance ?? canvas?.dimensions?.distance ?? 5;
        const distancePx = (distance / gridDistance) * gridSize;
        const rad = (direction * Math.PI) / 180;

        let secondary;
        if (farpoint && (farpoint.x !== primary.x || farpoint.y !== primary.y)) {
            secondary = { x: farpoint.x, y: farpoint.y };
        } else if (distancePx > 0) {
            secondary = {
                x: primary.x + Math.cos(rad) * distancePx,
                y: primary.y + Math.sin(rad) * distancePx
            };
        } else {
            const token = config.token ?? config.sourceToken;
            const tokenCenter = token?.center ?? (token?.x !== undefined ? { x: token.x, y: token.y } : null);
            if (tokenCenter && Math.hypot(primary.x - tokenCenter.x, primary.y - tokenCenter.y) >= 1) {
                secondary = primary;
                primary = { x: tokenCenter.x, y: tokenCenter.y };
            }
        }

        const width = doc.width ?? placeable?.width ?? 0;
        const height = Math.sqrt(Math.max(0, distance * distance - width * width));

        const center = {
            x: primary.x + (width / 2) * (gridSize / gridDistance),
            y: primary.y + (height / 2) * (gridSize / gridDistance)
        };

        return [primary, secondary, center];
    }

    /* -------------------------------------------- */
    /*  Scene Background (V12)                      */
    /* -------------------------------------------- */

    /**
     * Retrieve the background texture and offsets for a scene on Foundry V12 (Scene#background).
     * @param {Scene} [scene=canvas.scene] Target scene document
     * @param {Level|null} [_level=null] Unused in V12
     * @returns {{ src: string|null, offsetX: number, offsetY: number }}
     */
    getSceneBackground(scene = canvas?.scene, _level = null) {
        if (!scene) return { src: null, offsetX: 0, offsetY: 0 };
        const bg = scene.background;
        const src = typeof bg?.src === 'string' ? bg.src : (typeof bg === 'string' ? bg : null);
        return {
            src,
            offsetX: Number(bg?.offsetX ?? 0),
            offsetY: Number(bg?.offsetY ?? 0)
        };
    }

    /* -------------------------------------------- */
    /*  Document Deletion Format (V12)              */
    /* -------------------------------------------- */

    /**
     * Format a document update payload to delete/remove a specific property key.
     * In Foundry V12, formats using legacy "-=<keyId>" deletion syntax.
     *
     * @param {string} path Dot-delimited parent property path (e.g. "flags.eskie-macros.token-masks")
     * @param {string} keyId The property key to delete
     * @returns {Record<string, *>} Update dictionary
     */
    formatDeletionUpdate(path, keyId) {
        const fullKey = path ? `${path}.-=${keyId}` : `-=${keyId}`;
        return { [fullKey]: null };
    }

    /**
     * Preload Handlebars templates in Foundry V12 using global loadTemplates.
     * @override
     * @param {string[]} paths Array of template paths
     * @returns {Promise<Function[]>}
     */
    async loadTemplates(paths) {
        return loadTemplates(paths);
    }
}
