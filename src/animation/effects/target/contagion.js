// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'contagion',
    sound: {
        ...DEFAULT_SOUND_CONFIG,
        enable: false,
        file: '',
    },
};

function getSceneCoverSizeGU(target) {
    const gs = canvas?.grid?.size ?? 100;
    const rect = canvas?.dimensions?.sceneRect ?? { x: 0, y: 0, width: 4000, height: 4000 };
    const corners = [
        { x: rect.x, y: rect.y },
        { x: rect.x + rect.width, y: rect.y },
        { x: rect.x, y: rect.y + rect.height },
        { x: rect.x + rect.width, y: rect.y + rect.height },
    ];
    const c = target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };
    let maxDist = 0;
    for (const p of corners) {
        const d = Math.hypot(p.x - c.x, p.y - c.y);
        if (d > maxDist) maxDist = d;
    }
    return (2 * maxDist) / gs + 2;
}

async function create(token, target, config = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { sound } = mConfig;

    if (!token || !target) return;

    const targetSquare = adapter.getNearestSquareCenter(token, target) ?? target.center ?? { x: target.x ?? 0, y: target.y ?? 0 };
    const sceneCoverGU = getSceneCoverSizeGU(target);
    const tokenWidth = token.document?.width ?? token.width ?? 1;

    const sequence = new Sequence();
    applySound(sequence, sound);

    sequence
        .effect()
            .copySprite(token)
            .attachTo(token)
            .filter('Glow', { distance: 5, color: 0x98d723 })
            .belowTokens()
            .duration(2000)
            .fadeIn(500)
            .fadeOut(1500)

        .effect()
            .delay(500)
            .file(closest('eskie.poison.token_mask.01.green.full'))
            .attachTo(target)
            .scaleToObject(1, { considerTokenScale: true })
            .mask()
            .zIndex(1)

        .wait(500)

        .effect()
            .copySprite(target)
            .attachTo(target)
            .mask(target)
            .opacity(0.25)
            .loopProperty('sprite', 'scale.y', { from: 1, to: 1.25, duration: 2000, ease: 'easeInOutSine' })
            .loopProperty('sprite', 'scale.x', { from: 1, to: 1.25, duration: 2000, ease: 'easeInOutSine' })
            .loopProperty('sprite', 'alpha', { from: 0.25, to: -0.25, duration: 2000, ease: 'easeInOutSine' })
            .duration(4000)
            .fadeOut(1500)

        .effect()
            .delay(50)
            .file(closest('eskie.aura.token.ribbon.02.green'))
            .attachTo(token)
            .rotateTowards(target)
            .scaleToObject(1.5, { considerTokenScale: true })
            .spriteRotation(-90)
            .spriteOffset({ x: -0.75 * tokenWidth }, { gridUnits: true })
            .opacity(0.75)

        .effect()
            .file(closest('eskie.attack.touch.generic.01.green'))
            .atLocation(token)
            .rotateTowards(targetSquare)
            .size(tokenWidth + 0.25, { gridUnits: true })
            .filter('ColorMatrix', { hue: -15 })
            .playbackRate(0.75)
            .spriteOffset({ x: -0.15 }, { gridUnits: true })
            .zIndex(2)

        .effect()
            .delay(250)
            .file(closest('jb2a.impact.004.green'))
            .attachTo(target)
            .scaleToObject(1.5, { considerTokenScale: true })
            .playbackRate(0.8)
            .filter('ColorMatrix', { hue: -15 })
            .belowTokens()

        .effect()
            .delay(250)
            .file(closest('eskie.texture_mask.ink.01.black'))
            .attachTo(target)
            .scaleIn(0, 1000, { ease: 'easeOutCubic' })
            .size(sceneCoverGU, { gridUnits: true })
            .startTime(1000)
            .belowTiles()
            .opacity(0.75)
            .duration(4500)
            .fadeOut(1000);

    return sequence;
}

async function play(token, target, config = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
}

function stop() {
    // Transient animation
}

export const contagion = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autorec.register('contagion', 'melee-target', 'eskie.effect.contagion', DEFAULT_CONFIG, '0.0.1', 'Contagion');
