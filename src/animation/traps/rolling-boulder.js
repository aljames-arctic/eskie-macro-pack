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
    boulder: {
        src: 'jb2a.rolling_boulder.loop.01.rock.brown',
        speed: 200,
        size: 4.25,
    },
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(tile, targets, config = {}) {
    config = settingsOverride(config);
    const tileDoc = tile.document;

    // Check for tile-level trap.boulder overrides from MATT flags
    const tileBoulder = tileDoc.getFlag(MODULE_ID, 'trap.boulder') ?? {};
    const baseConfig = adapter.mergeObject(DEFAULT_CONFIG, { boulder: tileBoulder });
    const mConfig = adapter.mergeObject(baseConfig, config);

    const boulder = {
        src: mConfig.boulder?.src ?? DEFAULT_CONFIG.boulder.src,
        speed: mConfig.boulder?.speed ?? DEFAULT_CONFIG.boulder.speed,
        size: mConfig.boulder?.size ?? DEFAULT_CONFIG.boulder.size,
    };
    const sound = mConfig.sound;

    // Retrieve end tile from flags
    const targetTileIds = tileDoc.getFlag(MODULE_ID, 'trap.trapTargetTileIds') ?? [];
    const endTile = adapter.getPlaceable(targetTileIds[0]);

    if (!endTile) {
        log.warn(`Rolling Boulder Trap: Tile "${tileDoc.id}" has no configured end tile.`);
        ui.notifications.warn(game.i18n.format('EMP.traps.rollingBoulder.noEndTile', { id: tileDoc.id }));
        let seq = new Sequence();
        applySound(seq, sound);
        return seq;
    }

    const startLoc = adapter.getCenter(tile);
    const endLoc = adapter.getCenter(endTile);

    if (!startLoc || !endLoc) {
        log.warn(`Rolling Boulder Trap: Could not resolve coordinates for start or end tile.`);
        let seq = new Sequence();
        applySound(seq, sound);
        return seq;
    }

    // Dynamically calculate duration from distance between source and destination tile and speed
    const distancePx = Math.hypot(endLoc.x - startLoc.x, endLoc.y - startLoc.y);
    const speed = boulder.speed > 0 ? boulder.speed : DEFAULT_CONFIG.boulder.speed;
    const duration = Math.max(100, Math.round((distancePx / speed) * 1000));

    let seq = new Sequence();
    applySound(seq, sound);
    return seq
        .canvasPan()
        .delay(500)
        .shake({ duration: 500, strength: 2, rotation: false })

        // Pre-boulder loop shadow/ground rumble effect
        .effect()
        .file(closest(boulder.src))
        .atLocation(startLoc)
        .scaleIn(0, Math.min(500, Math.round(duration / 3)), { ease: 'easeOutCubic' })
        .fadeIn(Math.min(500, Math.round(duration / 6)))
        .size(Math.max(0.1, boulder.size - 0.5), { gridUnits: true })
        .duration(500)
        .filter('ColorMatrix', { brightness: 0 })
        .filter('Blur', { blurX: 5, blurY: 10 })
        .opacity(0.5)
        .belowTokens()

        // Impact smoke wave at start location
        .effect()
        .delay(Math.round(duration / 6))
        .file(closest('jb2a.impact.white.01'))
        .atLocation(startLoc)
        .size(boulder.size * 1.15, { gridUnits: true })
        .belowTokens()
        .randomRotation()

        // Main rolling boulder loop travelling from start to end tile
        .effect()
        .delay(200)
        .file(closest(boulder.src))
        .atLocation(startLoc)
        .scaleIn(1, Math.round(duration / 3), { ease: 'easeOutCubic' })
        .fadeIn(Math.round(duration / 6))
        .size(Math.max(0.1, boulder.size - 0.4), { gridUnits: true })
        .moveTowards(endLoc, { ease: 'easeInSine' })
        .duration(duration)
        .spriteRotation(-90)
        .zIndex(3)
        .waitUntilFinished(-Math.round(duration / 8))

        // Impact flash at target/crash point
        .effect()
        .delay(250)
        .file(closest('jb2a.impact.white.01'))
        .atLocation(endLoc)
        .size(boulder.size * 1.15, { gridUnits: true })
        .belowTokens()
        .randomRotation()

        // Grenade blast/debris explosion on crash
        .effect()
        .file(closest('jb2a.explosion.shrapnel.grenade.02.black'))
        .atLocation(endLoc)
        .size(boulder.size * 1.25, { gridUnits: true })
        .zIndex(4)

        // Explosion smoke cloud
        .effect()
        .delay(100)
        .file(closest('jb2a.smoke.puff.centered.grey'))
        .atLocation(endLoc)
        .playbackRate(0.65)
        .fadeOut(1500)
        .size(boulder.size * 2.2, { gridUnits: true })
        .filter('ColorMatrix', { brightness: 0.65 })
        .zIndex(4);
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
    const extraFlags = { ...config.extraFlags };
    if (config.boulder) {
        extraFlags.boulder = config.boulder;
    }
    return matt.trap.setup('eskie.traps.rollingBoulder', { tileCount: 3, ...config, extraFlags });
}

export const rollingBoulder = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
