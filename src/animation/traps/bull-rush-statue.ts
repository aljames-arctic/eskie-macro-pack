/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { MODULE_ID } from '../../lib/constants.js';
import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { setupTrap } from './trap-manager.js';
import { log } from '../../lib/logger.js';

import { adapter } from "../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../utils/sound.js";
import type { SoundConfig, TrapConfig, TrapModule } from '../../types/animation.js';

export interface BullRushStatueConfig extends TrapConfig {
    targetLocation?: { x: number; y: number } | string | null;
    pushDistance?: number;
    sound?: SoundConfig;
    textureSrc?: string;
    playbackRate?: number;
}

const DEFAULT_CONFIG: BullRushStatueConfig = {
    targetLocation: null,
    pushDistance: 1,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(tile: Tile, targets: Token[] = [], config: BullRushStatueConfig = {}): Promise<any> {
    config = settingsOverride(config);
    const { targetLocation, pushDistance, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    const target = targets.length ? targets[0] : null;

    const tileDoc = tile.document;
    const tileBounds = adapter.getBounds(tile);
    const tileCenter = tileBounds.center;
    const tileWidth = tileBounds.width;
    const tileHeight = tileBounds.height;

    const targetLoc = targetLocation ? adapter.getTargetLocation(targetLocation) : null;

    if (!targetLoc) {
        log.warn(`Bull Rush Statue Trap: Tile "${tile.id}" has no configured target location.`);
        let seq = new Sequence();
        applySound(seq, sound);
        return seq;
    }

    const textureSrc = config.textureSrc ?? adapter.getPlaceableTexture(tile) ?? closest('jb2a.boulder.01.brown');
    const scaleX = tileDoc.texture?.scaleX ?? 1;
    const scaleY = tileDoc.texture?.scaleY ?? 1;

    let seq = new Sequence();
    applySound(seq, sound);

    const startCenter = tileCenter;
    const distance = {
        x: targetLoc.x - startCenter.x,
        y: targetLoc.y - startCenter.y
    };

    const getDirection = (value: any) => {
        if (value > 0) return 1;
        if (value < 0) return -1;
        return 0;
    };

    const direction = {
        x: getDirection(distance.x),
        y: getDirection(distance.y)
    };

    const gridSize = adapter.getGridSize();
    const destination = {
        x: targetLoc.x + (gridSize * pushDistance) * direction.x,
        y: targetLoc.y + (gridSize * pushDistance) * direction.y
    };

    const slideDistance = {
        x: distance.x - (gridSize * 0.5) * direction.x,
        y: distance.y - (gridSize * 0.5) * direction.y
    };

        seq = seq
            .wait(500)

            .effect()
            .file(textureSrc)
            .atLocation(tileCenter)
            .size({ width: tileWidth * scaleX, height: tileHeight * scaleY })
            .spriteRotation(-adapter.getTileRotation(tile))
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

    return seq;
}

async function play(tile: Tile, targets: Token[] = [], config: BullRushStatueConfig = {}): Promise<any> {
    config = settingsOverride(config);
    const seq = await create(tile, targets, config);
    return seq.play();
}

async function stop(tile: Tile, config: BullRushStatueConfig = {}): Promise<void> {
    // No persistent effects to stop
}

async function setup(config: Record<string, unknown> = {}): Promise<any> {
    return setupTrap('eskie.traps.bullRushStatue', { tileCount: 3, requiresTile: true, ...config });
}

export const bullRushStatue: TrapModule<BullRushStatueConfig> = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
