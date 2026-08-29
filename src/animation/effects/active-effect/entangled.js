// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";

const DEFAULT_CONFIG = {
    id: 'entangled',
    color: 'green',
    scale: 1.3,
    sound: { ...DEFAULT_SOUND_CONFIG }
};

async function create(token, config = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, color, scale, sound } = mConfig;

    if (!token) return;

    const label = `${id} - ${token.id}`;
    const seq = new Sequence();
    applySound(seq, sound);

    seq.effect()
        .name(label)
        .file(closest(`eskie.nature.vine.normal.token.01.physical.${color}`))
        .attachTo(token)
        .scaleToObject(scale, { considerTokenScale: true })
        .persist();

    return seq;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

async function stop(token, config = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mConfig;
    if (token) {
        Sequencer.EffectManager.endEffects({ name: `${id} - ${token.id}`, object: token });
    }
}

export const entangled = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

autorec.register('entangled', 'effect', 'eskie.effect.entangled', DEFAULT_CONFIG, '0.0.2', 'Entangled');
