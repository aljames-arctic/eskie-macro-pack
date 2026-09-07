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
    size: 3.5,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const { size, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);
    const targetList = (targets && targets.length > 0) ? [targets].flat().filter(Boolean) : adapter.getTokensInTile(tile);

    const tileDoc = tile.document ?? tile;
    const tileBounds = adapter.getTileBounds(tile);
    const tileCenter = tileBounds.center;

    const targetTileIds = tileDoc.getFlag?.(MODULE_ID, 'trap.trapTargetTileIds') ?? [];
    const targetTile = targetTileIds.length ? canvas.tiles.get(targetTileIds[0]) : null;
    const targetTileBounds = targetTile ? adapter.getTileBounds(targetTile) : null;
    const targetLoc = targetTileBounds?.center ?? (targetList.length ? (targetList[0].center ?? targetList[0].object?.center) : null);

    if (!targetLoc) {
        log.warn(`Fire Trap: Tile "${tileDoc.id}" has no configured target tile or targeted tokens.`);
        let seq = new Sequence();
        applySound(seq, sound);
        return seq;
    }

    let seq = new Sequence();
    applySound(seq, sound);

    seq = seq
        // Cone fire breath weapon
        .effect()
        .file(closest('jb2a.breath_weapons02.burst.cone.fire.orange.02'))
        .atLocation(tileCenter)
        .size(size, { gridUnits: true })
        .stretchTo(targetLoc)
        .zIndex(1);

    if (targetList.length > 0) {
        targetList.forEach(target => {
            const targetDoc = target.document ?? target;
            const targetRotation = targetDoc.rotation;

            seq = seq
                // Burning token shake effect
                .effect()
                .copySprite(target)
                .spriteRotation(-targetRotation)
                .delay(2000)
                .attachTo(target)
                .scaleToObject(1, { considerTokenScale: true })
                .fadeIn(250)
                .fadeOut(750)
                .loopProperty('spriteContainer', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
                .duration(2000)
                .opacity(0.25);
        });
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
    return matt.trap.setup('eskie.traps.fire', { tileCount: 3, ...config });
}

export const fire = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
