// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'sweepingAttack',
    color: 'blue',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: any, targets: any[] = [], config: any = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { color, sound } = mConfig;

    if (!token) return;

    const userTargets = targets.length > 0 ? targets : Array.from(game.user?.targets ?? []);
    const target1 = userTargets[0];
    const target2 = userTargets[1] ?? mConfig.secondaryTarget ?? target1;

    if (!target1) return;

    const effectSize = 2 + (0.25 * 2);
    const effectOffset = -0.75 - (0.25 * 2);

    const p1 = adapter.getNearestSquareCenter(token, target1);
    const p2 = target2 ? adapter.getNearestSquareCenter(token, target2) : null;
    const targetSquare = (p1 && p2)
        ? { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
        : (p1 ?? adapter.getCenter(token));

    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;

    const sequence = new Sequence();
    applySound(sequence, sound);

    sequence
        .effect()
            .file(closest(`eskie.attack.melee.generic.01.bludgeoning.heavy.${color}.fast.01`))
            .atLocation(token)
            .rotateTowards(targetSquare)
            .scaleToObject(effectSize, { considerTokenScale: true })
            .spriteOffset({ x: effectOffset * tokenWidth }, { gridUnits: true })
            .zIndex(1)
            .rotateIn(-270, 250, { ease: 'easeInExpo' })
            .rotateOut(45, 750, { ease: 'easeOutExpo' })

        .effect()
            .file(closest('eskie.smoke.01.white'))
            .atLocation(token)
            .rotateTowards(targetSquare)
            .scaleToObject(effectSize + 1, { considerTokenScale: true })
            .spriteOffset({ x: effectOffset * (tokenWidth * 0.5) }, { gridUnits: true })
            .belowTokens()
            .opacity(0.5)

        .effect()
            .delay(150)
            .file(closest('eskie.damage.bludgeoning.01.yellow'))
            .size(1.5 * tokenWidth, { gridUnits: true })
            .atLocation(target1)
            .randomRotation()
            .zIndex(1);

    if (target2 && target2 !== target1) {
        sequence
            .effect()
                .delay(150)
                .file(closest('eskie.damage.bludgeoning.01.yellow'))
                .size(1.5 * tokenWidth, { gridUnits: true })
                .atLocation(target2)
                .randomRotation()
                .zIndex(1);
    }

    return sequence;
}

async function play(token: any, targets: any[] = [], config: any = {}) {
    const sequence = await create(token, targets, config);
    if (sequence) return sequence.play();
}

function stop() {
    // Transient animation
}

export const sweepingAttack = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register('sweepingAttack', 'melee-target', 'eskie.effect.battlemaster.sweepingAttack', DEFAULT_CONFIG, '0.0.1', 'Sweeping Attack');
