// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'lungingAttack',
    type: 'slashing', // 'slashing', 'piercing', 'bludgeoning'
    weight: 'medium', // 'light', 'medium', 'heavy'
    color: 'blue',
    tint: '#01aafe',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

function deg(rad) { return (rad * 180) / Math.PI; }

async function create(token, target, config = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { type, weight, color, tint, sound } = mConfig;

    if (!token || !target) return;

    const weightIndex = { light: 0, medium: 1, heavy: 2 }[weight] ?? 1;
    const effectSize = 2 + (0.25 * weightIndex);
    const effectOffset = -0.75 - (0.25 * weightIndex);

    const targetSquare = adapter.getNearestSquareCenter(token, target) ?? target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };

    const src = token.center ?? { x: token.x ?? 0, y: token.y ?? 0 };
    const tgt = target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };

    const baseRad = Math.atan2(tgt.y - src.y, tgt.x - src.x);
    const counterRot = deg(baseRad);

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

    const tokenWidth = token.document?.width ?? token.width ?? 1;

    const sequence = new Sequence();
    applySound(sequence, sound);

    sequence
        .animation()
            .on(token)
            .opacity(0)
            .delay(100)

        .effect()
            .copySprite(token)
            .attachTo(token, { bindAlpha: false })
            .rotateTowards(target)
            .scaleToObject(0.9, { considerTokenScale: true })
            .animateProperty('sprite', 'position.x', { from: 0, to: 0.5, duration: 500, ease: 'easeOutSine', gridUnits: true, delay: 250 })
            .animateProperty('sprite', 'position.x', { from: 0, to: -0.5, duration: 1000, ease: 'easeOutCubic', gridUnits: true, delay: 1000 })
            .spriteOffset({ x: -0.5 }, { gridUnits: true })
            .belowTokens()
            .filter('ColorMatrix', { brightness: 0 })
            .filter('Blur', { blurX: 5, blurY: 10 })
            .opacity(0.65)
            .fadeOut(500)
            .duration(2100)
            .spriteRotation(-counterRot)

        .effect()
            .copySprite(token)
            .attachTo(token, { bindAlpha: false })
            .rotateTowards(target)
            .scaleToObject(1, { considerTokenScale: true })
            .animateProperty('sprite', 'position.x', { from: 0, to: 0.5, duration: 500, ease: 'easeOutSine', gridUnits: true, delay: 250 })
            .animateProperty('sprite', 'position.x', { from: 0, to: -0.5, duration: 1000, ease: 'easeOutCubic', gridUnits: true, delay: 1000 })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: hop, duration: 250, ease: 'easeOutCubic', gridUnits: true, delay: 250 })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: -hop, duration: 250, ease: 'easeOutCubic', gridUnits: true, delay: 500 })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: hopVert, duration: 250, ease: 'easeOutCubic', gridUnits: true, delay: 250 })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -hopVert, duration: 250, ease: 'easeOutCubic', gridUnits: true, delay: 500 })
            .spriteOffset({ x: -0.5 }, { gridUnits: true })
            .duration(2100)
            .spriteRotation(-counterRot)
            .zIndex(1)

        .effect()
            .delay(50)
            .copySprite(token)
            .attachTo(token, { bindAlpha: false })
            .rotateTowards(target)
            .scaleToObject(1, { considerTokenScale: true })
            .animateProperty('sprite', 'position.x', { from: 0, to: 0.5, duration: 500, ease: 'easeOutSine', gridUnits: true, delay: 250 })
            .animateProperty('sprite', 'position.x', { from: 0, to: -0.5, duration: 1000, ease: 'easeOutCubic', gridUnits: true, delay: 1000 })
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
            .attachTo(token, { bindAlpha: false })
            .rotateTowards(target)
            .scaleToObject(1, { considerTokenScale: true })
            .animateProperty('sprite', 'position.x', { from: 0, to: 0.5, duration: 500, ease: 'easeOutSine', gridUnits: true, delay: 250 })
            .animateProperty('sprite', 'position.x', { from: 0, to: -0.5, duration: 1000, ease: 'easeOutCubic', gridUnits: true, delay: 1000 })
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

        .animation()
            .on(token)
            .opacity(1)
            .delay(2000)

        .wait(400)

        .effect()
            .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.normal.02`))
            .atLocation(token)
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

async function play(token, target, config = {}) {
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

autorec.register('lungingAttack', 'melee-target', 'eskie.effect.battlemaster.lungingAttack', DEFAULT_CONFIG, '0.0.1', 'Lunging Attack');
