/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { MODULE_ID } from '../../lib/constants.js';
import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { matt } from '../utils/matt-tiles.js';
import { log } from '../../lib/logger.js';

import { adapter } from "../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../utils/sound.js";
const DEFAULT_CONFIG = {
    pushDistance: 1,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { pushDistance, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    const targetList = (targets && targets.length > 0) ? targets : adapter.getTokensInTile(tile);
    const target = targetList.length ? targetList[0] : null;
    const targetTileIds = tile.document?.getFlag(MODULE_ID, 'trap.trapTargetTileIds') ?? [];
    let targetTile = targetTileIds.length ? canvas.tiles.get(targetTileIds[0]) : null;

    if (!targetTile) {
        const triggerTile = canvas.tiles.placeables.find(t => t.document.getFlag(MODULE_ID, 'trap.originIds')?.includes(tile.id) || t.document.getFlag(MODULE_ID, 'trap.trapTileIds')?.includes(tile.id));
        if (triggerTile) targetTile = triggerTile;
    }

    const tileDoc = tile.document ?? tile;
    const tileBounds = adapter.getTileBounds(tile);
    const tileCenter = tileBounds.center;
    const tileWidth = tileBounds.width;
    const tileHeight = tileBounds.height;

    const targetTileBounds = targetTile ? adapter.getTileBounds(targetTile) : null;
    const targetLoc = targetTileBounds?.center ?? (target ? (target.object?.center ?? target.center ?? target) : null);

    // Direct texture resolution from the Tile Document (Foundry VTT v10+)
    const textureSrc = tileDoc.texture?.src ?? tile.texture?.src ?? '';
    const scaleX = tileDoc.texture?.scaleX ?? 1;
    const scaleY = tileDoc.texture?.scaleY ?? 1;

    if (!targetLoc) {
        log.warn("Bull Rush Statue: No target location resolved. Ensure that a target token is passed, or that the trap tile is linked to a target/trigger tile via flags.", {
            tile,
            targets,
            targetTileIds,
            targetTile
        });
    }

    let seq = new Sequence();
    applySound(seq, sound);

    if (targetLoc) {
        const startCenter = tileCenter;
        const distance = {
            x: targetLoc.x - startCenter.x,
            y: targetLoc.y - startCenter.y
        };

        const getDirection = (value) => {
            if (value > 0) return 1;
            if (value < 0) return -1;
            return 0;
        };

        const direction = {
            x: getDirection(distance.x),
            y: getDirection(distance.y)
        };

        const destination = {
            x: targetLoc.x + (canvas.grid.size * pushDistance) * direction.x,
            y: targetLoc.y + (canvas.grid.size * pushDistance) * direction.y
        };

        const slideDistance = {
            x: distance.x - (canvas.grid.size * 0.5) * direction.x,
            y: distance.y - (canvas.grid.size * 0.5) * direction.y
        };

        seq = seq
            .wait(500)

            .effect()
            .file(textureSrc)
            .atLocation(tileCenter)
            .size({ width: tileWidth * scaleX, height: tileHeight * scaleY })
            .spriteRotation(-(tileDoc.rotation ?? 0))
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: slideDistance.x, duration: 500, ease: 'easeOutQuint', delay: 200 })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: slideDistance.y, duration: 500, ease: 'easeOutQuint', delay: 200 })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -slideDistance.x, duration: 3000, ease: 'easeInOutQuad', delay: 700 })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: -slideDistance.y, duration: 3000, ease: 'easeInOutQuad', delay: 700 })
            .duration(4000)

            // Hide the actual tile while animating copy sprite
            .animation()
            .delay(200)
            .on(tile)
            .opacity(0)

            // Smoke at statue origin (Right)
            .effect()
            .delay(200)
            .file(closest('eskie.smoke.01.white'))
            .atLocation(tileCenter)
            .size({ width: tileWidth * 1.75, height: tileHeight * 1.75 })
            .belowTokens()
            .opacity(0.5)

            // Smoke at statue origin (Left)
            .effect()
            .delay(200)
            .file(closest('eskie.smoke.01.white'))
            .atLocation(tileCenter)
            .size({ width: tileWidth * 1.75, height: tileHeight * 1.75 })
            .mirrorX()
            .belowTokens()
            .opacity(0.5);

        if (target) {
            seq = seq
                // Move the target back
                .animation()
                .delay(300)
                .on(target)
                .moveTowards(destination, { relativeToCenter: true });
        }

        seq = seq
            .wait(3700)

            // Restore the actual tile opacity
            .animation()
            .on(tile)
            .opacity(1);
    }

    return seq;
}

async function play(tile, targets, config = {}) {
    config = settingsOverride(config);
    const seq = await create(tile, targets, config);
    return seq.play();
}

async function stop(tile, config = {}) {
    // No persistent effects to stop
}

async function setup(config = {}) {
    return matt.trap.setup('eskie.traps.bullRushStatue', { tileCount: 3, ...config });
}

export const bullRushStatue = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
