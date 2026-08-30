// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'parry',
    slowParry: false,
    type: 'slashing', // 'slashing', 'piercing', 'bludgeoning'
    weight: 'medium', // 'light', 'medium', 'heavy'
    color: 'blue',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

function deg(rad) { return (rad * 180) / Math.PI; }

async function create(token, target, config = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { slowParry, type, weight, color, sound } = mConfig;

    if (!token) return;
    const tgt = target ?? token;

    const src = token.center ?? { x: token.x ?? 0, y: token.y ?? 0 };
    const tgtCenter = tgt.center ?? { x: tgt.x ?? 0, y: tgt.y ?? 0 };

    const baseRad = Math.atan2(tgtCenter.y - src.y, tgtCenter.x - src.x);
    const baseDeg = deg(baseRad);

    const tokenWidth = token.document?.width ?? token.width ?? 1;

    const sequence = new Sequence();
    applySound(sequence, sound);

    sequence
        .animation()
            .on(token)
            .opacity(0)
            .delay(100)

        .effect()
            .name('Parry')
            .copySprite(token)
            .atLocation(token)
            .rotateTowards(tgt)
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -0.6, duration: 250, gridUnits: true, ease: 'easeOutCubic', delay: 100 })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: 0.6, duration: 400, gridUnits: true, ease: 'easeOutSine', delay: 450 })
            .duration(1000)
            .spriteRotation(-baseDeg)
            .spriteOffset({ x: -0.5 }, { gridUnits: true });

    if (!slowParry) {
        sequence
            .effect()
                .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.normal.01`))
                .atLocation(token)
                .rotateTowards(tgt)
                .scaleToObject(2, { considerTokenScale: true })
                .spriteOffset({ x: -1.675 * tokenWidth }, { gridUnits: true })
                .randomizeMirrorY()
                .zIndex(1)

            .effect()
                .file(closest('eskie.particle.05.orange'))
                .atLocation(token)
                .scaleToObject(2, { considerTokenScale: true })
                .randomRotation()
                .zIndex(1.1);
    } else {
        sequence
            .effect()
                .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.slow.01`))
                .atLocation(token)
                .rotateTowards(tgt)
                .scaleToObject(2, { considerTokenScale: true })
                .spriteOffset({ x: -1.675 * tokenWidth }, { gridUnits: true })
                .randomizeMirrorY()
                .zIndex(1)

            .effect()
                .file(closest('eskie.particle.07.orange'))
                .atLocation(token)
                .rotateTowards(tgt)
                .scaleToObject(1.5, { considerTokenScale: true })
                .zIndex(1.1)
                .spriteOffset({ x: -1.25 * tokenWidth }, { gridUnits: true });
    }

    sequence
        .wait(850)
        .animation()
            .on(token)
            .opacity(1);

    return sequence;
}

async function play(token, target, config = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play({ preload: true });
}

function stop() {
    // Transient animation
}

export const parry = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autorec.register('parry', 'melee-target', 'eskie.effect.battlemaster.parry', DEFAULT_CONFIG, '0.0.1', 'Parry');
