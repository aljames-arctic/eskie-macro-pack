// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { resolveMotionTarget, computeCenterDelta } from '../../utils/motion.js';

const DEFAULT_CONFIG = {
    id: 'baitAndSwitch',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, target: Token, config: any = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { sound } = mConfig;

    if (!token || !target) return;

    const tokenCenter = adapter.getCenter(token);
    const targetCenter = adapter.getCenter(target);
    const tokenDelta = computeCenterDelta(token, targetCenter);
    const targetDelta = computeCenterDelta(target, tokenCenter);
    const dist = Math.hypot(tokenDelta.x, tokenDelta.y);
    const motionToken = resolveMotionTarget(token);
    const motionTarget = resolveMotionTarget(target);

    // Match original moveSpeed(500) for target and moveSpeed(300) for token
    const targetMoveDuration = Math.max(1, Math.round((dist / 500) * 1000));
    const tokenMoveDuration = Math.max(1, Math.round((dist / 300) * 1000));
    const targetArrive = Math.max(750, 250 + targetMoveDuration);
    const tokenArrive = Math.max(1000, 500 + tokenMoveDuration);

    let blurDirectionX = 0;
    let blurDirectionY = 0;
    if (token.x === target.x) blurDirectionY = 15;
    if (token.y === target.y) blurDirectionX = 20;

    const sequence = new Sequence();
    applySound(sequence, sound);

    if (dist >= 1) {
        if (motionTarget) {
            sequence
                .motion(motionTarget)
                .zIndex(0.2)
                .moveBy(targetDelta, {
                    delay: 250,
                    duration: targetMoveDuration,
                    ease: 'easeInBack',
                    return: false,
                })
                .persistUntilUpdate();
        }

        if (motionToken) {
            sequence
                .motion(motionToken)
                .moveBy(tokenDelta, {
                    delay: 500,
                    duration: tokenMoveDuration,
                    ease: 'easeOutCubic',
                    return: false,
                })
                .persistUntilUpdate();
        }
    }

    sequence
        .effect()
            .copySprite(token)
            .atLocation(tokenCenter)
            .scaleToObject(1, { considerTokenScale: true })
            .moveTowards(targetCenter, { rotate: false, ease: 'easeOutCubic', delay: 500 })
            .moveSpeed(300)
            .duration(1250)
            .opacity(0.85)
            .fadeIn(50, { delay: 500 })
            .fadeOut(500, { ease: 'easeOutQuint' })
            .filter('Blur', { blurX: blurDirectionX, blurY: blurDirectionY })
            .zIndex(0.1)

        .effect()
            .file(closest('eskie.smoke.01.white'))
            .atLocation(targetCenter)
            .rotateTowards(tokenCenter)
            .scaleToObject(1.5, { considerTokenScale: true })
            .belowTokens()
            .delay(750)
            .opacity(0.4)
            .spriteOffset({ x: -0.5 }, { gridUnits: true })
            .mirrorX()
            .spriteRotation(180);

    if (dist >= 1) {
        sequence
            .animation()
                .delay(targetArrive)
                .on(target)
                .teleportTo(tokenCenter, { relativeToCenter: true })
                .snapToGrid()

            .animation()
                .delay(tokenArrive)
                .on(token)
                .teleportTo(targetCenter, { relativeToCenter: true })
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

export const baitAndSwitch = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('baitAndSwitch', 'melee-target', 'eskie.effect.battlemaster.baitAndSwitch', DEFAULT_CONFIG, '0.0.1', 'Bait and Switch');
