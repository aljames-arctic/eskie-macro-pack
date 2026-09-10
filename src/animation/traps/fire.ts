/**
 * Original Author: eskiemoh#2969
 * Modular Conversion: bakanabaka
 */

import { MODULE_ID } from '../../lib/constants.js';
import { closest } from '../../lib/filemanager.js';
import { settingsOverride } from '../../lib/settings.js';
import { setupTrap } from './trap-manager.js';

import { log, notify } from '../../lib/logger.js';
import { adapter } from "../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../utils/sound.js";
import type { SoundConfig, TrapConfig, TrapModule } from '../../types/animation.js';

export interface FireTrapConfig extends TrapConfig {
    targetLocation?: { x: number; y: number } | string | null;
    size?: number;
    sound?: SoundConfig;
}

const DEFAULT_CONFIG: FireTrapConfig = {
    targetLocation: null,
    size: 3.5,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(trapObject: Tile, targets: Token[] = [], config: FireTrapConfig = {}): Promise<any> {
    config = settingsOverride(config);
    const { targetLocation, size, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    const targetLoc = targetLocation ? adapter.getTargetLocation(targetLocation) : null;

    if (!targetLoc) {
        log.warn(`Fire Trap: Placeable "${trapObject.id}" has no configured target location.`);
        let seq = new Sequence();
        applySound(seq, sound);
        return seq;
    }

    const trapCenter = adapter.getTargetLocation(trapObject);

    if (Math.hypot(targetLoc.x - trapCenter.x, targetLoc.y - trapCenter.y) < 1) {
        const errorMsg = `Fire Trap: Placeable "${trapObject.id}" target location is identical to origin location.`;
        log.error(errorMsg);
        notify.error(errorMsg);
        throw new Error(errorMsg);
    }

    let seq = new Sequence();
    applySound(seq, sound);

    seq = seq
        // Cone fire breath weapon
        .effect()
        .file(closest('jb2a.breath_weapons02.burst.cone.fire.orange.02'))
        .atLocation(trapCenter)
        .size(size, { gridUnits: true })
        .stretchTo(targetLoc)
        .zIndex(1);

    if (targets.length > 0) {
        targets.forEach(target => {
            seq = seq
                // Burning token shake effect
                .effect()
                .copySprite(target)
                .spriteRotation(-adapter.getTokenRotation(target))
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

async function play(trapObject: Tile, targets: Token[] = [], config: FireTrapConfig = {}): Promise<any> {
    config = settingsOverride(config);
    const seq = await create(trapObject, targets, config);
    return seq.play();
}

async function stop(trapObject: Tile, config: FireTrapConfig = {}): Promise<void> {
    // No persistent effects to stop
}

async function setup(config: Record<string, unknown> = {}): Promise<any> {
    return setupTrap('eskie.traps.fire', { tileCount: 3, ...config });
}

export const fire: TrapModule<FireTrapConfig> = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
