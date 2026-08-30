// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'scorchingRay',
    rayCount: 3,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token, targets, config = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { rayCount, sound, rayCounts: explicitCounts } = mConfig;

    if (!token) return;

    let targetList = [];
    if (Array.isArray(targets)) {
        targetList = targets;
    } else if (targets) {
        targetList = [targets];
    } else if (mConfig.targets?.length) {
        targetList = mConfig.targets;
    } else {
        targetList = Array.from(game.user?.targets ?? []);
    }

    if (targetList.length === 0) return;

    const midpoint = {
        x: targetList.reduce((sum, t) => sum + (t.center?.x ?? t.x ?? 0), 0) / targetList.length,
        y: targetList.reduce((sum, t) => sum + (t.center?.y ?? t.y ?? 0), 0) / targetList.length,
    };

    const sequence = new Sequence();
    applySound(sequence, sound);

    sequence
        .effect()
            .file(closest('eskie.casting.arcane.01.side.loop.orange'))
            .attachTo(token)
            .rotateTowards(midpoint)
            .scaleToObject(1.5, { considerTokenScale: true })
            .spriteOffset({ x: -0.2 }, { gridUnits: true })
            .fadeOut(250)
            .zIndex(1)

        .effect()
            .delay(500)
            .file(closest('eskie.particle.02.orange'))
            .attachTo(token)
            .rotateTowards(midpoint)
            .spriteOffset({ x: -0.9 }, { gridUnits: true })
            .size(1.5, { gridUnits: true })
            .fadeIn(250)
            .fadeOut(500)
            .duration(1750);

    const counts = explicitCounts ?? targetList.map((t, idx) => {
        const base = Math.floor(rayCount / targetList.length);
        const remainder = rayCount % targetList.length;
        return {
            target: t,
            rayCount: base + (idx < remainder ? 1 : 0),
        };
    });

    let rayIndex = 0;
    for (const item of counts) {
        for (let i = 0; i < item.rayCount; i++) {
            const delayOffset = 500 + (rayIndex * 150);
            const raySeq = new Sequence()
                .wait(delayOffset)
                .effect()
                    .file(closest('jb2a.scorching_ray.orange'))
                    .attachTo(token)
                    .stretchTo(item.target, { randomOffset: 0.5, gridUnits: true })
                    .randomizeMirrorY()
                    .scale(0.5)
                    .template({ gridSize: 200, startPoint: 10, endPoint: 200 })
                    .zIndex(2)
                .effect()
                    .delay(500)
                    .file(closest('eskie.damage.fire.01.orange'))
                    .attachTo(item.target, { randomOffset: 0.5, gridUnits: true })
                    .scaleToObject(0.8, { considerTokenScale: true });

            sequence.addSequence(raySeq);
            rayIndex++;
        }
    }

    return sequence;
}

async function play(token, targets, config = {}) {
    const sequence = await create(token, targets, config);
    if (sequence) return sequence.play();
}

function stop() {
    // Transient animation
}

export const scorchingRay = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autorec.register('scorchingRay', 'ranged-target', 'eskie.effect.scorchingRay', DEFAULT_CONFIG, '0.0.1', 'Scorching Ray');
