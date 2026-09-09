/**
 * Original Author: EskieMoh#2969
 * Update Author: bakanabaka
 */

import { closest } from '../../../lib/filemanager.js';
import { template as templatelib } from '../../../lib/templates.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'firecracker',
    deleteTemplate: true,
    sound: { ...DEFAULT_SOUND_CONFIG }
};

async function create(token: any, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, template, sound } = mConfig;

    const cfg = {
        label: 'Firecracker',
        icon: token?.document?.texture?.src ?? ''
    };
    let [position, _] = await templatelib.getPosition(template, cfg);
    if (!position || position.cancelled) { return null; }

    let seq = new Sequence();
    applySound(seq, sound);
    seq = seq
        .effect()
        .name(id)
        .repeats(10, 50, 50)
        .file(closest("jb2a.impact.yellow.01"))
        .atLocation(position, { randomOffset: 1 })
        .size(0.8, { gridUnits: true })
        .randomRotation()
        .delay(500);

    seq = seq
        .effect()
        .name(id)
        .repeats(5, 50, 50)
        .file(closest("jb2a.impact.yellow.01"))
        .atLocation(position, { randomOffset: 1 })
        .size(0.8, { gridUnits: true })
        .randomRotation()
        .delay(1000);

    seq = seq
        .effect()
        .name(id)
        .repeats(5, 50, 50)
        .file(closest("jb2a.impact.yellow.01"))
        .atLocation(position, { randomOffset: 1 })
        .size(0.8, { gridUnits: true })
        .randomRotation()
        .delay(500);

    seq = seq
        .effect()
        .name(id)
        .file(closest("jb2a.particles.outward.orange.02.03"))
        .atLocation(position)
        .duration(5000)
        .fadeOut(1500)
        .scale(0.5)
        .randomRotation()
        .delay(500);

    return seq;
}

async function play(token: any, config: any = {}) {
    let seq = await create(token, config);
    if (seq) { await seq.play(); }
}

function stop(token: any, { id = DEFAULT_CONFIG.id }: any = {}) {
    Sequencer.EffectManager.endEffects({ name: id, object: token });
}

export const firecracker = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register("firecracker", "template", "eskie.effect.firecracker", DEFAULT_CONFIG, "0.0.1", "Firecracker");