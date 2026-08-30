// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'rayOfSickness',
    sound: {
        ...DEFAULT_SOUND_CONFIG,
        enable: false,
        file: '',
    },
};

async function create(token, target, config = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { sound } = mConfig;

    if (!token || !target) return;

    const targetSquare = adapter.getNearestSquareCenter(token, target) ?? target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };
    const targetCenter = target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };
    const targetOffset = { x: targetSquare.x - targetCenter.x, y: targetSquare.y - targetCenter.y };
    const targetWidth = target.document?.width ?? target.width ?? 1;

    const sequence = new Sequence();
    applySound(sequence, sound);

    sequence
        .effect()
            .file(closest('eskie.velocity.01.white'))
            .atLocation(token)
            .rotateTowards(targetSquare)
            .scaleToObject(2, { considerTokenScale: true })
            .zIndex(3)
            .opacity(0.25)
            .spriteOffset({ x: -1 }, { gridUnits: true })
            .tint('#98d723')

        .effect()
            .file(closest('jb2a.eldritch_blast.green'))
            .atLocation(token)
            .stretchTo(targetSquare, { offset: { x: -0.25 }, gridUnits: true, local: true })
            .scale(0.5)
            .startTime(1000)
            .spriteOffset({ x: 0.25 }, { gridUnits: true })
            .filter('ColorMatrix', { hue: -12 })
            .zIndex(1)
            .waitUntilFinished(-3000)

        .effect()
            .copySprite(target)
            .attachTo(target)
            .scaleToObject(1, { considerTokenScale: true })
            .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
            .opacity(0.5)
            .duration(1000)
            .fadeOut(250)

        .effect()
            .file(closest('eskie.texture_mask.ink.01.black'))
            .attachTo(target, { offset: targetOffset })
            .scaleToObject(((2 * targetWidth) - 1) / targetWidth, { considerTokenScale: true })
            .playbackRate(1.5)
            .mask(target)
            .opacity(0.5)
            .startTime(1000)

        .effect()
            .file(closest('eskie.smoke.05.green'))
            .atLocation(targetSquare, { offset: { x: 0, y: 0 }, gridUnits: true, local: false })
            .rotateTowards(token)
            .scaleIn(0, 750, { ease: 'easeOutCubic' })
            .spriteAnchor({ x: 0.5, y: 1 })
            .spriteOffset({ x: -0.5 }, { gridUnits: true })
            .spriteScale({ x: 1, y: 1.25 }, { gridUnits: true })
            .spriteRotation(90)
            .fadeOut(500)
            .duration(750)
            .scaleToObject(1, { considerTokenScale: true })
            .mirrorY()
            .opacity(0.5)

        .effect()
            .file(closest('eskie.smoke.05.green'))
            .atLocation(targetSquare, { offset: { x: 0, y: 0 }, gridUnits: true, local: false })
            .rotateTowards(token)
            .scaleIn(0, 750, { ease: 'easeOutCubic' })
            .spriteAnchor({ x: 0.5, y: 1 })
            .spriteOffset({ x: -0.5 }, { gridUnits: true })
            .spriteRotation(-45)
            .fadeOut(500)
            .duration(750)
            .scaleToObject(1, { considerTokenScale: true })
            .opacity(0.5)

        .effect()
            .file(closest('eskie.smoke.05.green'))
            .atLocation(targetSquare, { offset: { x: 0, y: 0 }, gridUnits: true, local: false })
            .rotateTowards(token)
            .scaleIn(0, 750, { ease: 'easeOutCubic' })
            .spriteAnchor({ x: 0.5, y: 1 })
            .spriteOffset({ x: -0.5 }, { gridUnits: true })
            .spriteRotation(-135)
            .fadeOut(500)
            .duration(750)
            .scaleToObject(1, { considerTokenScale: true })
            .opacity(0.5)

        .effect()
            .file(closest('eskie.poison.01.green.full'))
            .attachTo(target, { offset: targetOffset })
            .size(0.65, { gridUnits: true })
            .mask(target)
            .zIndex(0)

        .effect()
            .file(closest('eskie.damage.poison.01.green'))
            .atLocation(targetSquare)
            .size(1.75, { gridUnits: true })
            .zIndex(1);

    return sequence;
}

async function play(token, target, config = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
}

function stop() {
    // Transient animation
}

export const rayOfSickness = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autorec.register('rayOfSickness', 'ranged-target', 'eskie.effect.rayOfSickness', DEFAULT_CONFIG, '0.0.1', 'Ray of Sickness');
