// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { resolveMotionTarget } from '../../utils/motion.js';

const DEFAULT_CONFIG = {
    id: 'parry',
    slowParry: false,
    type: 'slashing', // 'slashing', 'piercing', 'bludgeoning'
    weight: 'medium', // 'light', 'medium', 'heavy'
    color: 'blue',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, target: Token, config: any = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { slowParry, type, weight, color, sound } = mConfig;

    if (!token || !target) return;

    const src = adapter.getCenter(token);
    const tgtCenter = adapter.getCenter(target);

    const baseRad = Math.atan2(tgtCenter.y - src.y, tgtCenter.x - src.x);
    const stepBack = {
        x: -0.6 * Math.cos(baseRad),
        y: -0.6 * Math.sin(baseRad),
    };

    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;
    const motionToken = resolveMotionTarget(token);

    const sequence = new Sequence();
    applySound(sequence, sound);

    if (motionToken) {
        sequence
            .motion(motionToken)
            .name('Parry')
            .moveBy(
                [
                    { v: { x: 0, y: 0 } },
                    { v: stepBack, duration: 250, inEase: 'easeOutCubic', hold: 100 },
                    { v: { x: 0, y: 0 }, duration: 400, inEase: 'easeOutSine' },
                ],
                { gridUnits: true, delay: 100, return: false }
            );
    }

    if (!slowParry) {
        sequence
            .effect()
                .file(closest(`eskie.attack.melee.generic.01.${type}.${weight}.${color}.normal.01`))
                .atLocation(token)
                .rotateTowards(target)
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
                .rotateTowards(target)
                .scaleToObject(2, { considerTokenScale: true })
                .spriteOffset({ x: -1.675 * tokenWidth }, { gridUnits: true })
                .randomizeMirrorY()
                .zIndex(1)

            .effect()
                .file(closest('eskie.particle.07.orange'))
                .atLocation(token)
                .rotateTowards(target)
                .scaleToObject(1.5, { considerTokenScale: true })
                .zIndex(1.1)
                .spriteOffset({ x: -1.25 * tokenWidth }, { gridUnits: true });
    }

    return sequence;
}

async function play(token: Token, target: Token, config: any = {}) {
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

adapter.autorec.register('parry', 'melee-target', 'eskie.effect.battlemaster.parry', DEFAULT_CONFIG, '0.0.1', 'Parry');
