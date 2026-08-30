// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'tripAttack',
    type: 'bludgeoning', // 'slashing', 'piercing', 'bludgeoning'
    weight: 'heavy', // 'light', 'medium', 'heavy'
    color: 'blue',
    sound: {
        ...DEFAULT_SOUND_CONFIG,
        enable: false,
        file: '',
    },
};

async function create(token, target, config = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { type, weight, color, sound } = mConfig;

    if (!token || !target) return;

    const weightIndex = { light: 0, medium: 1, heavy: 2 }[weight] ?? 2;
    const effectSize = 2 + (0.25 * weightIndex);
    const effectOffset = -0.75 - (0.25 * weightIndex);

    const targetSquare = adapter.getNearestSquareCenter(token, target) ?? target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };
    const tokenWidth = token.document?.width ?? token.width ?? 1;
    const targetRotation = target.document?.rotation ?? target.rotation ?? 0;

    const sequence = new Sequence();
    applySound(sequence, sound);

    sequence
        .effect()
            .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.normal.01`))
            .atLocation(token)
            .rotateTowards(targetSquare)
            .scaleToObject(effectSize, { considerTokenScale: true })
            .spriteOffset({ x: effectOffset * tokenWidth }, { gridUnits: true })
            .zIndex(1)

        .animation()
            .delay(100)
            .on(target)
            .opacity(0)

        .effect()
            .copySprite(target)
            .attachTo(target, { bindAlpha: false, bindRotation: false, local: false })
            .scaleToObject(0.9, { considerTokenScale: true })
            .zIndex(0.1)
            .belowTokens()
            .filter('ColorMatrix', { brightness: 0 })
            .filter('Blur', { blurX: 5, blurY: 10 })
            .opacity(0.65)
            .duration(1200)

        .effect()
            .delay(100)
            .file(closest(`eskie.damage.${type}.01.yellow`))
            .attachTo(target, { bindAlpha: false, bindRotation: false })
            .scaleToObject(2, { considerTokenScale: true })
            .opacity(1)
            .zIndex(1)
            .belowTokens()
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.5, duration: 500, ease: 'easeOutCubic', gridUnits: true })

        .effect()
            .copySprite(target)
            .attachTo(target, { bindAlpha: false, bindRotation: false, local: false })
            .scaleToObject(1, { considerTokenScale: true })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.5, duration: 500, ease: 'easeOutCubic', delay: 100, gridUnits: true })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: 0.5, duration: 250, ease: 'easeOutCubic', delay: 600, gridUnits: true })
            .animateProperty('sprite', 'rotation', { from: 0, to: 90, duration: 250, ease: 'easeOutCubic', delay: 100 })
            .zIndex(2)
            .duration(1200)
            .waitUntilFinished(-500)

        .effect()
            .file(closest('eskie.smoke.03.white'))
            .attachTo(target, { bindAlpha: false, bindRotation: false })
            .scaleToObject(2, { considerTokenScale: true })
            .opacity(0.8)
            .belowTokens()

        .animation()
            .delay(300)
            .on(target)
            .opacity(1)
            .rotate(targetRotation + 90);

    return sequence;
}

async function play(token, target, config = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
}

function stop() {
    // Transient animation
}

export const tripAttack = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autorec.register('tripAttack', 'melee-target', 'eskie.effect.battlemaster.tripAttack', DEFAULT_CONFIG, '0.0.1', 'Trip Attack');
