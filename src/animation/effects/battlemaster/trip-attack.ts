// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { resolveMotionTarget } from '../../utils/motion.js';

const DEFAULT_CONFIG = {
    id: 'tripAttack',
    type: 'bludgeoning', // 'slashing', 'piercing', 'bludgeoning'
    weight: 'heavy', // 'light', 'medium', 'heavy'
    color: 'blue',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, target: Token, config: any = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { type, weight, color, sound } = mConfig;

    if (!token || !target) return;

    const weightIndex = ({ light: 0, medium: 1, heavy: 2 } as Record<string, number>)[weight] ?? 2;
    const effectSize = 2 + (0.25 * weightIndex);
    const effectOffset = -0.75 - (0.25 * weightIndex);

    const targetSquare = adapter.getNearestSquareCenter(token, target);
    if (!targetSquare) return;
    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;
    const targetRotation = adapter.getTokenRotation(target);
    const motionTarget = resolveMotionTarget(target);

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

        .effect()
            .copySprite(target)
            .attachTo(target, { bindAlpha: false, bindRotation: false, local: false, ignoreMotion: true })
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
            .attachTo(target, { bindAlpha: false, bindRotation: false, ignoreMotion: true })
            .scaleToObject(2, { considerTokenScale: true })
            .opacity(1)
            .zIndex(1)
            .belowTokens()
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.5, duration: 500, ease: 'easeOutCubic', gridUnits: true });

    if (motionTarget) {
        sequence
            .motion(motionTarget)
            .zIndex(2)
            .moveBy(
                [
                    { v: { x: 0, y: 0 } },
                    { v: { x: 0, y: -0.5 }, duration: 500, inEase: 'easeOutCubic' },
                    { v: { x: 0, y: 0 }, duration: 250, inEase: 'easeOutCubic' },
                ],
                { gridUnits: true, delay: 100, return: false }
            )
            .rotateBy(90, {
                delay: 100,
                duration: 250,
                ease: 'easeOutCubic',
                return: false,
            })
            .persistUntilUpdate();
    }

    sequence
        .wait(700)

        .effect()
            .file(closest('eskie.smoke.03.white'))
            .attachTo(target, { bindAlpha: false, bindRotation: false, ignoreMotion: true })
            .scaleToObject(2, { considerTokenScale: true })
            .opacity(0.8)
            .belowTokens()

        .animation()
            .delay(300)
            .on(target)
            .rotate(targetRotation + 90);

    return sequence;
}

async function play(token: Token, target: Token, config: any = {}) {
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

adapter.autorec.register('tripAttack', 'melee-target', 'eskie.effect.battlemaster.tripAttack', DEFAULT_CONFIG, '0.0.1', 'Trip Attack');
