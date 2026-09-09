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
const DEFAULT_CONFIG = {
    targetLocation: null,
    size: 3.5,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(trapObject, targets, config = {}) {
    config = settingsOverride(config);
    const { targetLocation, size, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);
    const targetList = (targets && targets.length > 0) ? [targets].flat().filter(Boolean) : adapter.getTokensInPlaceable(trapObject);

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

    if (targetList.length > 0) {
        targetList.forEach(target => {
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

async function play(trapObject, targets, config = {}) {
    config = settingsOverride(config);
    const seq = await create(trapObject, targets, config);
    return seq.play();
}

async function stop(trapObject, config = {}) {
    // No persistent effects to stop
}

async function setup(config = {}) {
    return setupTrap('eskie.traps.fire', { tileCount: 3, ...config });
}

export const fire = {
    create,
    play,
    stop,
    setup,
    default_config: DEFAULT_CONFIG,
};
