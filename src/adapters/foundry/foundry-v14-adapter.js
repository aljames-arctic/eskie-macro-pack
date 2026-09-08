import { FoundryV13Adapter } from './foundry-v13-adapter.js';

/**
 * Modern Foundry VTT platform adapter (Foundry V14+).
 * Extends FoundryV13Adapter and overrides centered tile anchor offsets, Region geometry calculations,
 * Level/Environment background extraction, and ForcedDeletion operators.
 */
export class FoundryV14Adapter extends FoundryV13Adapter {
    /* -------------------------------------------- */
    /*  Tile Anchor & Coordinate Math (V14+)        */
    /* -------------------------------------------- */

    /**
     * Calculate reveal tile placement offset for Foundry V14+ (centered anchor (0.5, 0.5)).
     * Centered origin matches token center directly.
     *
     * @param {PlaceableObject} object Token or Tile placeable
     * @param {number} [_scale=1] Additional scale multiplier (unused in V14 centered origin)
     * @returns {{x: number, y: number}} Offset coordinates
     */
    getRevealOffset(object, _scale = 1) {
        if (!object) return { x: 0, y: 0 };
        return object.center ?? { x: object.x, y: object.y };
    }

    /**
     * Calculate shape tile placement offset for Foundry V14+ (centered anchor (0.5, 0.5)).
     *
     * @param {PlaceableObject} object Token or Tile placeable
     * @returns {{x: number, y: number}} Offset coordinates
     */
    getShapeOffset(object) {
        if (!object) return { x: 0, y: 0 };
        return object.center ?? { x: object.x, y: object.y };
    }

    /**
     * Calculate bounding box and center for a Tile on Foundry V14+.
     * Evaluates V14 tile anchor configuration (defaulting to centered (0.5, 0.5)).
     * @override
     * @param {Tile} tile Target tile placeable
     * @returns {{ minX: number, maxX: number, minY: number, maxY: number, center: {x: number, y: number}, width: number, height: number, anchor: {x: number, y: number} }}
     */
    getTileBounds(tile) {
        if (!tile) return { minX: 0, maxX: 0, minY: 0, maxY: 0, center: { x: 0, y: 0 }, width: 0, height: 0, anchor: { x: 0.5, y: 0.5 } };
        const doc = tile.document ?? tile;
        const x = doc.x ?? tile.x ?? 0;
        const y = doc.y ?? tile.y ?? 0;
        const width = doc.width ?? tile.width ?? 0;
        const height = doc.height ?? tile.height ?? 0;

        const anchorX = doc.anchor?.x ?? tile.anchor?.x ?? doc.texture?.anchorX ?? 0.5;
        const anchorY = doc.anchor?.y ?? tile.anchor?.y ?? doc.texture?.anchorY ?? 0.5;

        const minX = x - (anchorX * width);
        const maxX = minX + width;
        const minY = y - (anchorY * height);
        const maxY = minY + height;
        const center = tile.center ?? doc.center ?? { x: minX + width / 2, y: minY + height / 2 };

        return {
            minX,
            maxX,
            minY,
            maxY,
            center,
            width,
            height,
            anchor: { x: anchorX, y: anchorY }
        };
    }

    /* -------------------------------------------- */
    /*  Template Position Extraction (V14+ Regions) */
    /* -------------------------------------------- */

    /**
     * Gets position coordinates from a Region or MeasuredTemplate document.
     *
     * @param {Region|MeasuredTemplate} template The Region or MeasuredTemplate placeable or document
     * @param {Object} [config={}] Configuration options
     * @returns {[ {x: number, y: number}, {x: number, y: number}, {x: number, y: number} ]} Array of [primary, secondary, center] coordinates
     */
    getTemplatePosition(template, config = {}) {
        if (!template) return [];

        const doc = template.document ?? template;
        const isRegion = doc.documentName === 'Region' || Boolean(doc.shapes) || Boolean(template.shapes);

        if (isRegion) {
            const shapes = doc.shapes?.contents ?? doc.shapes ?? template.shapes ?? [];
            const shape = shapes[0] ?? doc.toObject?.()?.shapes?.[0] ?? null;

            const primary = {
                x: shape?.x ?? doc.x ?? template.x ?? 0,
                y: shape?.y ?? doc.y ?? template.y ?? 0
            };
            const center = {
                x: shape?.center?.x ?? doc.center?.x ?? template.center?.x ?? primary.x,
                y: shape?.center?.y ?? doc.center?.y ?? template.center?.y ?? primary.y
            };

            const { size: gridSize, distance: gridDistance } = this.getSceneDimensions(canvas?.scene);

            // Grid distance (feet) converted to canvas pixels when provided
            const gridUnits = config.distance ?? doc.distance ?? shape?.distance;
            const distancePx = gridUnits !== undefined && gridUnits > 0
                ? (gridUnits / gridDistance) * gridSize
                : (shape?.radius ?? shape?.height ?? shape?.width ?? 0);

            const rotation = shape?.rotation ?? doc.rotation ?? config.direction ?? 0;
            const rad = (rotation * Math.PI) / 180;

            let secondary;
            if (distancePx > 0) {
                secondary = { x: primary.x + Math.cos(rad) * distancePx, y: primary.y + Math.sin(rad) * distancePx };
            } else {
                const token = config.token ?? config.sourceToken;
                const tokenCenter = token?.center ?? (token?.x !== undefined ? { x: token.x, y: token.y } : null);
                if (tokenCenter && Math.hypot(primary.x - tokenCenter.x, primary.y - tokenCenter.y) >= 1) {
                    secondary = primary;
                    primary = { x: tokenCenter.x, y: tokenCenter.y };
                }
            }

            return this.resolveDistinctPositions([primary, secondary, center], config, template);
        }

        return super.getTemplatePosition(template, config);
    }

    /* -------------------------------------------- */
    /*  Scene & Level Background (V14+ Levels)      */
    /* -------------------------------------------- */

    /**
     * Resolves the texture image filepath from a V14 background or texture structure.
     * In V14, texture objects wrap the source string inside a TextureConfiguration object:
     * e.g. entry.src = { src: string|null, color, tint, alphaThreshold, ... }
     * @param {*} target The background or texture container
     * @returns {string|null}
     * @private
     */
    _extractTextureSource(target) {
        if (!target) return null;
        if (typeof target === 'string') return target;
        if (typeof target.src === 'string') return target.src;
        if (target.src && typeof target.src === 'object') {
            if (typeof target.src.src === 'string') return target.src.src;
            return null;
        }
        return null;
    }

    /**
     * Retrieve the background image source and offset for a scene on modern V14+ Foundry.
     * Evaluates active level textures or scene environment background.
     * Avoids accessing deprecated Scene#background.
     *
     * @param {Scene} [scene=canvas.scene] Target scene document
     * @param {Level|null} [level=null] Target level document or placeable (defaults to active level)
     * @returns {{ src: string|null, offsetX: number, offsetY: number }}
     */
    getSceneBackground(scene = canvas?.scene, level = null) {
        if (!scene) return { src: null, offsetX: 0, offsetY: 0 };

        const activeLevel = level
            ?? canvas?.level
            ?? scene.levels?.get?.(scene.activeLevel)
            ?? scene.levels?.contents?.[0]
            ?? scene.levels?.[0]
            ?? null;

        if (activeLevel) {
            const levelBg = activeLevel.background ?? activeLevel.textures?.background ?? activeLevel.texture ?? null;
            if (levelBg) {
                const src = this._extractTextureSource(levelBg);
                const offsetX = Number(levelBg.offsetX ?? activeLevel.offsetX ?? 0);
                const offsetY = Number(levelBg.offsetY ?? activeLevel.offsetY ?? 0);
                return { src, offsetX, offsetY };
            }
        }

        const envBg = scene.environment?.background ?? null;
        if (envBg) {
            const src = this._extractTextureSource(envBg);
            return {
                src,
                offsetX: Number(envBg.offsetX ?? 0),
                offsetY: Number(envBg.offsetY ?? 0)
            };
        }

        // Unmigrated legacy fallback if levels are not present
        const rawBg = scene.background;
        const src = this._extractTextureSource(rawBg);
        return {
            src,
            offsetX: Number(rawBg?.offsetX ?? 0),
            offsetY: Number(rawBg?.offsetY ?? 0)
        };
    }

    /**
     * Format a document update payload to delete/remove a specific property key.
     * In Foundry V14+, formats using foundry.data.operators.ForcedDeletion.
     *
     * @param {string} path Dot-delimited parent property path (e.g. "flags.eskie-macros.token-masks")
     * @param {string} keyId The property key to delete
     * @returns {Record<string, *>} Update dictionary
     */
    formatDeletionUpdate(path, keyId) {
        const fullKey = path ? `${path}.${keyId}` : keyId;
        const operator = foundry.data?.operators?.ForcedDeletion;
        return { [fullKey]: operator };
    }
}
