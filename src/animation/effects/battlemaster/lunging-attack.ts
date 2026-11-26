// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { resolveMotionTarget } from '../../utils/motion.js';

const DEFAULT_CONFIG = {
    id: 'lungingAttack',
    type: 'slashing', // 'slashing', 'piercing', 'bludgeoning'
    weight: 'medium', // 'light', 'medium', 'heavy'
    color: 'blue',
    tint: '#01aafe',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

function deg(rad: any) { return (rad * 180) / Math.PI; }

async function create(token: Token, target: Token, config: any = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { type, weight, color, tint, sound } = mConfig;

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
    const cos = Math.cos(baseRad);
    const sin = Math.sin(baseRad);

    const dx = tgt.x - src.x;
    let hop = -0.25;
    let hopVert = 0;

    if (dx === 0) {
        hop = 0;
        hopVert = -0.25;
    } else if (dx < 0) {
        hop = 0.25;
        hopVert = 0;
    } else {
        hop = -0.25;
        hopVert = 0;
    }

    const lungeVec = { x: 0.5 * cos, y: 0.5 * sin };
    const hopWorld = {
        x: (hopVert * cos) - (hop * sin),
        y: (hopVert * sin) + (hop * cos),
    };

    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;
    const motionToken = resolveMotionTarget(token);

    const sequence = new Sequence();
    applySound(sequence, sound);

    if (motionToken) {
        sequence
            .motion(motionToken)
            .zIndex(1)
            .moveBy(
                [
                    { v: { x: 0, y: 0 } },
                    { v: lungeVec, duration: 500, inEase: 'easeOutSine', hold: 250 },
                    { v: { x: 0, y: 0 }, duration: 1000, inEase: 'easeOutCubic' },
                ],
                { gridUnits: true, delay: 250, return: false }
            )
            .moveBy(
                [
                    { v: { x: 0, y: 0 } },
                    { v: hopWorld, duration: 250, inEase: 'easeOutCubic' },
                    { v: { x: 0, y: 0 }, duration: 250, inEase: 'easeOutCubic' },
                ],
                { gridUnits: true, delay: 250, return: false }
            );
    }

    sequence
        .effect()
            .copySprite(token)
            .attachTo(token, { bindAlpha: false, ignoreMotion: true })
            .rotateTowards(target)
            .scaleToObject(0.9, { considerTokenScale: true })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: 0.5, duration: 500, ease: 'easeOutSine', gridUnits: true, delay: 250 })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -0.5, duration: 1000, ease: 'easeOutCubic', gridUnits: true, delay: 1000 })
            .spriteOffset({ x: -0.5 }, { gridUnits: true })
            .belowTokens()
            .filter('ColorMatrix', { brightness: 0 })
            .filter('Blur', { blurX: 5, blurY: 10 })
            .opacity(0.65)
            .fadeOut(500)
            .duration(2100)
            .spriteRotation(-counterRot)

        .effect()
            .delay(50)
            .copySprite(token)
            .attachTo(token, { bindAlpha: false, ignoreMotion: true })
            .rotateTowards(target)
            .scaleToObject(1, { considerTokenScale: true })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: 0.5, duration: 500, ease: 'easeOutSine', gridUnits: true, delay: 250 })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -0.5, duration: 1000, ease: 'easeOutCubic', gridUnits: true, delay: 1000 })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: hop, duration: 250, ease: 'easeOutCubic', gridUnits: true, delay: 250 })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: -hop, duration: 250, ease: 'easeOutCubic', gridUnits: true, delay: 500 })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: hopVert, duration: 250, ease: 'easeOutCubic', gridUnits: true, delay: 250 })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -hopVert, duration: 250, ease: 'easeOutCubic', gridUnits: true, delay: 500 })
            .spriteOffset({ x: -0.5 }, { gridUnits: true })
            .duration(2100)
            .opacity(0.4)
            .fadeOut(1000, { ease: 'easeOutQuint' })
            .tint(tint)
            .filter('ColorMatrix', { brightness: 2 })
            .spriteRotation(-counterRot)

        .effect()
            .delay(100)
            .copySprite(token)
            .attachTo(token, { bindAlpha: false, ignoreMotion: true })
            .rotateTowards(target)
            .scaleToObject(1, { considerTokenScale: true })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: 0.5, duration: 500, ease: 'easeOutSine', gridUnits: true, delay: 250 })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -0.5, duration: 1000, ease: 'easeOutCubic', gridUnits: true, delay: 1000 })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: hop, duration: 250, ease: 'easeOutCubic', gridUnits: true, delay: 250 })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: -hop, duration: 250, ease: 'easeOutCubic', gridUnits: true, delay: 500 })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: hopVert, duration: 250, ease: 'easeOutCubic', gridUnits: true, delay: 250 })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -hopVert, duration: 250, ease: 'easeOutCubic', gridUnits: true, delay: 500 })
            .spriteOffset({ x: -0.5 }, { gridUnits: true })
            .duration(2100)
            .opacity(0.25)
            .fadeOut(1000, { ease: 'easeOutQuint' })
            .tint(tint)
            .filter('ColorMatrix', { brightness: 1.5 })
            .spriteRotation(-counterRot)

        .wait(400)

        .effect()
            .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.normal.02`))
            .atLocation(token, { ignoreMotion: true })
            .rotateTowards(targetSquare)
            .scaleToObject(effectSize, { considerTokenScale: true })
            .spriteOffset({ x: effectOffset * tokenWidth + 0.75 }, { gridUnits: true })
            .mirrorY(src.x >= tgt.x)
            .zIndex(2)

        .effect()
            .delay(150)
            .file(closest(`eskie.damage.${type}.01.yellow`))
            .size(1.25 * tokenWidth, { gridUnits: true })
            .atLocation(targetSquare)
            .randomRotation()
            .zIndex(0.1)

        .effect()
            .delay(150)
            .copySprite(target)
            .attachTo(target)
            .scaleToObject(1, { considerTokenScale: true })
            .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
            .opacity(0.25)
            .duration(1000)
            .fadeOut(750);

    return sequence;
}

async function play(token: Token, target: Token, config: any = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
}

function stop() {
    // Transient animation
}

export const lungingAttack = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('lungingAttack', 'melee-target', 'eskie.effect.battlemaster.lungingAttack', DEFAULT_CONFIG, '0.0.1', 'Lunging Attack');
