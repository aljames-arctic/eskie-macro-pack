// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { resolveMotionTarget } from '../../utils/motion.js';

const DEFAULT_CONFIG = {
    id: 'feintingAttack',
    type: 'slashing', // 'slashing', 'piercing', 'bludgeoning'
    weight: 'medium', // 'light', 'medium', 'heavy'
    color: 'blue',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

function deg(rad: any) { return (rad * 180) / Math.PI; }

async function create(token: Token, target: Token, config: any = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { type, weight, color, sound } = mConfig;

    if (!token || !target) return;

    const weightIndex = ({ light: 0, medium: 1, heavy: 2 } as Record<string, number>)[weight] ?? 1;
    const effectSize = 2 + (0.25 * weightIndex);
    const effectOffset = -0.75 - (0.25 * weightIndex);

    const targetSquare = adapter.getNearestSquareCenter(token, target);
    if (!targetSquare) return;

    const src = adapter.getCenter(token);
    const tgt = adapter.getCenter(target);

    const baseRad = Math.atan2(tgt.y - src.y, tgt.x - src.x);
    const counterRot = deg(baseRad);

    const baseRadTarget = Math.atan2(src.y - tgt.y, src.x - tgt.x);
    const targetRecoil = {
        x: -0.5 * Math.cos(baseRadTarget),
        y: -0.5 * Math.sin(baseRadTarget),
    };

    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;
    const motionTarget = resolveMotionTarget(target);

    const sequence = new Sequence();
    applySound(sequence, sound);

    if (motionTarget) {
        sequence
            .motion(motionTarget)
            .moveBy(
                [
                    { v: { x: 0, y: 0 } },
                    { v: targetRecoil, duration: 250, inEase: 'easeOutSine', hold: 250 },
                    { v: { x: 0, y: 0 }, duration: 250, inEase: 'easeOutCubic' },
                ],
                { gridUnits: true, delay: 250, return: false }
            )
            .rotateBy(
                [
                    { v: 0 },
                    { v: 20, duration: 500, inEase: 'easeOutCubic' },
                    { v: 0, duration: 250, inEase: 'easeOutBack' },
                    { v: 10, duration: 250, inEase: 'easeOutSine' },
                    { v: 0, duration: 250, inEase: 'easeOutSine' },
                ],
                { delay: 250, return: false }
            );
    }

    sequence
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

async function play(token: Token, target: Token, config: any = {}) {
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

adapter.autorec.register('feintingAttack', 'melee-target', 'eskie.effect.battlemaster.feintingAttack', DEFAULT_CONFIG, '0.0.1', 'Feinting Attack');
