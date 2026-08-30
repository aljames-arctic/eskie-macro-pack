// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'pushingAttack',
    pushDistance: 15,
    type: 'bludgeoning', // 'slashing', 'piercing', 'bludgeoning'
    weight: 'heavy', // 'light', 'medium', 'heavy'
    color: 'blue',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token, target, config = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { pushDistance, type, weight, color, sound } = mConfig;

    if (!token || !target) return;

    const weightIndex = { light: 0, medium: 1, heavy: 2 }[weight] ?? 2;
    const effectSize = 2 + (0.25 * weightIndex);
    const effectOffset = -0.75 - (0.25 * weightIndex);

    const targetSquare = adapter.getNearestSquareCenter(token, target) ?? target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };
    const tokenCenter = token.center ?? { x: token.x ?? 0, y: token.y ?? 0 };
    const targetCenter = target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };
    const gridSize = canvas?.grid?.size ?? 100;

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

    const tokenWidth = token.document?.width ?? token.width ?? 1;

    const sequence = new Sequence();
    applySound(sequence, sound);

    sequence
        .animation()
            .on(token)
            .opacity(0)
            .delay(100)

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
            .shake({ duration: 250, strength: 2, rotation: false })

        .effect()
            .copySprite(token)
            .atLocation(token)
            .scaleToObject(1, { considerTokenScale: true })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: backposition.x, duration: 250, ease: 'easeOutExpo', delay: 200 })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: backposition.y, duration: 250, ease: 'easeOutExpo', delay: 200 })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: middleposition.x - backposition.x, duration: 150, ease: 'easeOutExpo', delay: 1000 })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: middleposition.y - backposition.y, duration: 150, ease: 'easeOutExpo', delay: 1000 })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -middleposition.x, duration: 450, ease: 'easeOutQuad', delay: 1150 })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: -middleposition.y, duration: 450, ease: 'easeOutQuad', delay: 1150 })
            .duration(1750)

        .animation()
            .on(token)
            .opacity(1)
            .delay(1650)

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

        .wait(250)

        .animation()
            .on(target)
            .opacity(0)
            .delay(100)

        .effect()
            .copySprite(target)
            .atLocation(target)
            .scaleToObject(1, { considerTokenScale: true })
            .moveTowards(position, { rotate: false, ease: 'easeOutCirc', delay: 200 })
            .moveSpeed(1250)
            .waitUntilFinished(-100)

        .animation()
            .on(target)
            .moveTowards(position, { relativeToCenter: true })
            .snapToGrid()
            .opacity(1);

    return sequence;
}

async function play(token, target, config = {}) {
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

autorec.register('pushingAttack', 'melee-target', 'eskie.effect.battlemaster.pushingAttack', DEFAULT_CONFIG, '0.0.1', 'Pushing Attack');
