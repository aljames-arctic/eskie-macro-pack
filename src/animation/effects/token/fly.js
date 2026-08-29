// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
const DEFAULT_CONFIG = {
    id: "fly",
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token, config = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, sound } = mConfig;

    let seq = new Sequence();
    applySound(seq, sound);
    seq = seq.effect()
        .file(closest("jb2a.misty_step.01.blue"))
        .atLocation(token)
        .scaleToObject(1.75)
        .belowTokens();

    seq = seq.animation()
        .on(token)
        .opacity(0);

    seq = seq.effect()
        .copySprite(token)
        .spriteRotation(-token.document.rotation)
        .name(`${id} - ${token.id}`)
        .atLocation(token)
        .scaleToObject(1, { considerTokenScale: true })
        .opacity(1)
        .duration(800)
        .anchor({ x: 0.55, y: 0.9 })
        .animateProperty('spriteContainer', 'position.y', { from: 50, to: 0, duration: 500 })
        .loopProperty('spriteContainer', 'position.y', { from: 0, to: -50, duration: 2500, pingPong: true, delay: 500 })
        .attachTo(token, { bindAlpha: false })
        .zIndex(2)
        .persist();

    seq = seq.effect()
        .copySprite(token)
        .spriteRotation(-token.document.rotation)
        .name(`${id} - ${token.id}`)
        .atLocation(token)
        .scaleToObject(0.9, { considerTokenScale: true })
        .duration(1000)
        .opacity(0.5)
        .belowTokens()
        .filter("ColorMatrix", { brightness: -1 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .attachTo(token, { bindAlpha: false })
        .zIndex(1)
        .persist();

    return seq;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) { return seq.play(); }
}

async function stop(token, config = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, sound } = mConfig;

    return Promise.all([
        Sequencer.EffectManager.endEffects({ name: `${id} - ${token.id}`, object: token }),
        new Sequence().animation().on(token).opacity(1).play()
    ])
}

export const fly = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
