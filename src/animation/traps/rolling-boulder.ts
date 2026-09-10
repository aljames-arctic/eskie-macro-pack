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

export interface BoulderConfig {
    src?: string;
    speed?: number;
    size?: number;
    playbackRate?: number;
}

export interface RollingBoulderTrapConfig extends TrapConfig {
    targetLocation?: { x: number; y: number } | string | null;
    boulder?: BoulderConfig;
    sound?: SoundConfig;
}

const DEFAULT_CONFIG: RollingBoulderTrapConfig = {
    targetLocation: null,
    boulder: {
        src: 'jb2a.rolling_boulder.loop.01.rock.brown',
        speed: 200,
        size: 4.25,
        playbackRate: 1.0,
    },
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(trapObject: Tile, targets: Token[] = [], config: RollingBoulderTrapConfig = {}): Promise<any> {
    config = settingsOverride(config);
    const { targetLocation, boulder, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    const endLoc = targetLocation ? adapter.getTargetLocation(targetLocation) : null;

    if (!endLoc) {
        log.warn(`Rolling Boulder Trap: Placeable "${trapObject.id}" has no configured destination location.`);
        ui.notifications.warn(game.i18n.format('EMP.traps.rollingBoulder.noEndTile', { id: trapObject.id }));
        let seq = new Sequence();
        applySound(seq, sound);
        return seq;
    }

    const startLoc = adapter.getTargetLocation(trapObject);

    if (!startLoc || !endLoc) {
        log.warn(`Rolling Boulder Trap: Could not resolve coordinates for start or end location.`);
        let seq = new Sequence();
        applySound(seq, sound);
        return seq;
    }

    // Dynamically calculate duration from distance between source and destination tile and speed
    const distancePx = Math.hypot(endLoc.x - startLoc.x, endLoc.y - startLoc.y);
    const speed = boulder.speed > 0 ? boulder.speed : (DEFAULT_CONFIG.boulder?.speed ?? 200);
    const duration = Math.max(100, Math.round((distancePx / speed) * 1000));
    const playbackRate = boulder.playbackRate > 0 ? boulder.playbackRate : (DEFAULT_CONFIG.boulder?.playbackRate ?? 1.0);

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
        .playbackRate(playbackRate)
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
        .playbackRate(playbackRate)
        .spriteRotation(-90)
        .zIndex(3)
        .waitUntilFinished(-250)

        // Impact flash at target/crash point
        .effect()
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
        .file(closest('jb2a.smoke.puff.centered.grey'))
        .atLocation(endLoc)
        .playbackRate(0.65)
        .fadeOut(1500)
        .size(boulder.size * 2.2, { gridUnits: true })
        .filter('ColorMatrix', { brightness: 0.65 })
        .zIndex(4);
}

async function play(trapObject: Tile, targets: Token[] = [], config: RollingBoulderTrapConfig = {}): Promise<any> {
    config = settingsOverride(config);
    const seq = await create(trapObject, targets, config);
    return seq.play();
}

async function stop(trapObject: Tile, config: RollingBoulderTrapConfig = {}): Promise<void> {
    // No persistent effects to stop
}

async function setup(config: Record<string, unknown> = {}): Promise<any> {
    return setupTrap('eskie.traps.rollingBoulder', { tileCount: 3, ...config });
}

export const rollingBoulder: TrapModule<RollingBoulderTrapConfig> = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
