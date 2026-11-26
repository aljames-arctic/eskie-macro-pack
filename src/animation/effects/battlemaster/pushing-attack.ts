// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { resolveMotionTarget, computeCenterDelta } from '../../utils/motion.js';

const DEFAULT_CONFIG = {
    id: 'pushingAttack',
    pushDistance: 15,
    type: 'bludgeoning', // 'slashing', 'piercing', 'bludgeoning'
    weight: 'heavy', // 'light', 'medium', 'heavy'
    color: 'blue',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, target: Token, config: any = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { pushDistance, type, weight, color, sound } = mConfig;

    if (!token || !target) return;

    const weightIndex = ({ light: 0, medium: 1, heavy: 2 } as Record<string, number>)[weight] ?? 2;
    const effectSize = 2 + (0.25 * weightIndex);
    const effectOffset = -0.75 - (0.25 * weightIndex);

    const targetSquare = adapter.getNearestSquareCenter(token, target);
    const tokenCenter = adapter.getCenter(token);
    const targetCenter = adapter.getCenter(target);
    const gridSize = adapter.getGridSize();

    const position = {
        x: targetCenter.x - (gridSize * (pushDistance / 5) * Math.sign(tokenCenter.x - targetCenter.x)),
        y: targetCenter.y - (gridSize * (pushDistance / 5) * Math.sign(tokenCenter.y - targetCenter.y)),
    };

    const backposition = {
        x: (targetCenter.x - tokenCenter.x) * -0.1,
        y: (targetCenter.y - tokenCenter.y) * -0.1,
    };

    const middleposition = {
        x: (targetCenter.x - tokenCenter.x) * 0.26,
        y: (targetCenter.y - tokenCenter.y) * 0.26,
    };

    const distanceX = Math.abs(tokenCenter.x - targetCenter.x);
    const distanceY = Math.abs(tokenCenter.y - targetCenter.y);

    if (distanceY < distanceX) {
        position.y = targetCenter.y;
        middleposition.y = 0;
        backposition.y = 0;
    } else if (distanceX < distanceY) {
        position.x = targetCenter.x;
        middleposition.x = 0;
        backposition.x = 0;
    }

    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;
    const motionToken = resolveMotionTarget(token);
    const motionTarget = resolveMotionTarget(target);
    const pushDelta = computeCenterDelta(target, position);
    const pushDistPx = Math.hypot(pushDelta.x, pushDelta.y);
    const pushDuration = Math.max(100, Math.round((pushDistPx / 1250) * 1000));

    const sequence = new Sequence();
    applySound(sequence, sound);

    sequence
        .effect()
            .file(closest('eskie.smoke.02.white'))
            .atLocation({ x: tokenCenter.x - backposition.x, y: tokenCenter.y - backposition.y })
            .rotateTowards(target)
            .size(tokenWidth * 2.15, { gridUnits: true })
            .spriteOffset({ x: -1.5 }, { gridUnits: true })
            .spriteRotation(180)
            .belowTokens()
            .delay(150)

        .canvasPan()
            .delay(250)
            .shake({ duration: 250, strength: 2, rotation: false });

    if (motionToken) {
        sequence
            .motion(motionToken)
            .moveBy(
                [
                    { v: { x: 0, y: 0 } },
                    { v: backposition, duration: 250, inEase: 'easeOutExpo', hold: 550 },
                    { v: middleposition, duration: 150, inEase: 'easeOutExpo' },
                    { v: { x: 0, y: 0 }, duration: 450, inEase: 'easeOutQuad' },
                ],
                { delay: 200, return: false }
            );
    }

    sequence
        .effect()
            .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.slow`))
            .atLocation(token)
            .rotateTowards(targetSquare)
            .scaleToObject(effectSize, { considerTokenScale: true })
            .spriteOffset({ x: effectOffset * tokenWidth }, { gridUnits: true })
            .randomizeMirrorY()
            .zIndex(1)
            .delay(1000)

        .effect()
            .file(closest('jb2a.gust_of_wind.veryfast'))
            .atLocation(token)
            .stretchTo(position, { onlyX: true })
            .opacity(0.75)
            .belowTokens()
            .fadeOut(1000)
            .delay(1500)

        .effect()
            .delay(1000)
            .file(closest('eskie.trail.token.generic.01.white'))
            .atLocation(token)
            .rotateTowards(position)
            .scaleToObject(1.5, { considerTokenScale: true })
            .startTime(750)
            .spriteOffset({ x: -1.25 }, { gridUnits: true })

        .wait(1000)

        .effect()
            .file(closest(`eskie.damage.${type}.01.yellow`))
            .atLocation(target)
            .size(tokenWidth * 1.5, { gridUnits: true })
            .zIndex(1)

        .wait(250);

    if (motionTarget && pushDistPx >= 1) {
        sequence
            .motion(motionTarget)
            .moveBy(pushDelta, { delay: 200, duration: pushDuration, ease: 'easeOutCirc', return: false })
            .persistUntilUpdate()
            .wait(200 + pushDuration)
            .animation()
            .on(target)
            .teleportTo(position, { relativeToCenter: true })
            .snapToGrid();
    } else if (pushDistPx >= 1) {
        sequence
            .animation()
            .on(target)
            .delay(200)
            .teleportTo(position, { relativeToCenter: true })
            .snapToGrid();
    }

    return sequence;
}

async function play(token: Token, target: Token, config: any = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
}

function stop() {
    // Transient animation
}

export const pushingAttack = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('pushingAttack', 'melee-target', 'eskie.effect.battlemaster.pushingAttack', DEFAULT_CONFIG, '0.0.1', 'Pushing Attack');
