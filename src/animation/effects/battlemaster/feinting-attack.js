// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'feintingAttack',
    type: 'slashing', // 'slashing', 'piercing', 'bludgeoning'
    weight: 'medium', // 'light', 'medium', 'heavy'
    color: 'blue',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

function deg(rad) { return (rad * 180) / Math.PI; }

async function create(token, target, config = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { type, weight, color, sound } = mConfig;

    if (!token || !target) return;

    const weightIndex = { light: 0, medium: 1, heavy: 2 }[weight] ?? 1;
    const effectSize = 2 + (0.25 * weightIndex);
    const effectOffset = -0.75 - (0.25 * weightIndex);

    const targetSquare = adapter.getNearestSquareCenter(token, target) ?? target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };

    const src = token.center ?? { x: token.x ?? 0, y: token.y ?? 0 };
    const tgt = target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };

    const baseRad = Math.atan2(tgt.y - src.y, tgt.x - src.x);
    const counterRot = deg(baseRad);

    const baseRadTarget = Math.atan2(src.y - tgt.y, src.x - tgt.x);
    const counterRotTarget = deg(baseRadTarget);

    const tokenWidth = token.document?.width ?? token.width ?? 1;

    const sequence = new Sequence();
    applySound(sequence, sound);

    sequence
        .animation()
            .on(target)
            .opacity(0)
            .delay(100)

        .effect()
            .copySprite(target)
            .attachTo(target, { bindAlpha: false })
            .rotateTowards(token)
            .scaleToObject(1, { considerTokenScale: true })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -0.5, duration: 250, ease: 'easeOutSine', gridUnits: true, delay: 250 })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: 0.5, duration: 250, ease: 'easeOutCubic', gridUnits: true, delay: 750 })
            .animateProperty('sprite', 'rotation', { from: 0, to: 20, duration: 500, ease: 'easeOutCubic', delay: 250 })
            .animateProperty('sprite', 'rotation', { from: 0, to: -20, duration: 250, ease: 'easeOutBack', delay: 750 })
            .animateProperty('sprite', 'rotation', { from: 0, to: 10, duration: 250, ease: 'easeOutSine', delay: 1000 })
            .animateProperty('sprite', 'rotation', { from: 0, to: -10, duration: 250, ease: 'easeOutSine', delay: 1250 })
            .spriteOffset({ x: -0.5 }, { gridUnits: true })
            .spriteRotation(-counterRotTarget)
            .duration(1350)

        .animation()
            .on(target)
            .opacity(1)
            .delay(1250)

        .wait(250)

        .effect()
            .copySprite(token)
            .attachTo(token, { bindAlpha: false })
            .rotateTowards(target)
            .scaleToObject(1, { considerTokenScale: true })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: 0.1, duration: 250, ease: 'easeOutSine', gridUnits: true })
            .spriteOffset({ x: -0.5 }, { gridUnits: true })
            .opacity(0.5)
            .fadeOut(300)
            .duration(500)
            .spriteRotation(-counterRot)

        .effect()
            .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.fast.03`))
            .atLocation(token)
            .rotateTowards(targetSquare)
            .scaleToObject(effectSize, { considerTokenScale: true })
            .spriteOffset({ x: effectOffset * tokenWidth - 0.25 }, { gridUnits: true })
            .opacity(0.5)
            .zIndex(1)

        .effect()
            .file(closest('eskie.star.02.white'))
            .atLocation(token)
            .scaleToObject(0.8, { considerTokenScale: true })
            .rotateTowards(targetSquare)
            .spriteOffset({ x: 0.35 }, { gridUnits: true })
            .zIndex(2);

    return sequence;
}

async function play(token, target, config = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
}

function stop() {
    // Transient animation
}

export const feintingAttack = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autorec.register('feintingAttack', 'melee-target', 'eskie.effect.battlemaster.feintingAttack', DEFAULT_CONFIG, '0.0.1', 'Feinting Attack');
