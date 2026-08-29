// Original Author: Mia Del'Mori
// Updated By: Eskie
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";
import { autorec, CONCENTRATING } from "../../../adapters/modules/autorec/autorec-module-adapter.js";

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
const DEFAULT_CONFIG = {
    id: 'levitation',
    tint: '#00b3ff',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

function create(token, config = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, tint } = mConfig;
    const label = `${id} - ${token.id}`;

    const sequence = new Sequence();
    applySound(sequence, sound);
    sequence
    .animation()
        .delay(75)
        .on(token)
        .opacity(0)

    // Bless loop effect
    .effect()
        .name(label)
        .atLocation(token)
        .attachTo(token, {bindAlpha: false})
        .file(closest("jb2a.bless.200px.loop.blue"))
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(2)
        .tint(tint)
        .persist()

    // Wind stream effect
    .effect()
        .name(label)
        .atLocation(token)
        .attachTo(token, {bindAlpha: false})
        .file(closest("jb2a.wind_stream.200.white"))
        .fadeIn(500)
        .fadeOut(500)
        .rotate(90)
        .tint(tint)
        .scaleToObject(1)
        .belowTokens()
        .persist()
    
    // Levitating token sprite
    .effect()
        .name(label)
        .copySprite(token)
        .spriteRotation(-token.document.rotation)
        .attachTo(token, {bindAlpha: false})
        .scaleToObject(1, { considerTokenScale: true })
        .fadeIn(500)
        .fadeOut(500)
        .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.6, duration: 2000, gridUnits: true, ease: "easeOutCubic" })
        .loopProperty('sprite', "rotation", {from: -10, to: 10, duration: 1100, pingPong: true, ease: "easeInOutSine" })
        .loopProperty('spriteContainer', 'position.x', {from: -canvas.grid.size/9, to: canvas.grid.size/9, duration: 2000, pingPong: true, ease: "easeInOutSine" })
        .loopProperty('spriteContainer', 'position.y', {from: -canvas.grid.size/9, to: canvas.grid.size/9, duration: 3000, pingPong: true, ease: "easeInOutSine" })
        .zIndex(2)
        .persist()

    // Levitating token border
    .effect()
        .name(label)
        .attachTo(token, {bindAlpha: false})
        .file(closest("jb2a.token_border.circle.static.blue.012"))
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(2)
        .belowTokens()
        .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.6, duration: 2000, gridUnits: true, ease: "easeOutCubic" })
        .loopProperty('sprite', "rotation", {from: -10, to: 10, duration: 1100, pingPong: true, ease: "easeInOutSine" })
        .loopProperty('spriteContainer', 'position.x', {from: -canvas.grid.size/9, to: canvas.grid.size/9, duration: 2000, pingPong: true, ease: "easeInOutSine" })
        .loopProperty('spriteContainer', 'position.y', {from: -canvas.grid.size/9, to: canvas.grid.size/9, duration: 3000, pingPong: true, ease: "easeInOutSine" })
        .zIndex(1)
        .persist();
    
    return sequence;
}

async function play(token, config = {}) {
    const sequence = create(token, config);
    if (sequence) return sequence.play();
}

async function stop(token, config = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, sound } = mConfig;
    const label = `${id} - ${token.id}`;

    new Sequence()
        .animation()
        .delay(75)
        .fadeIn(500)
        .fadeOut(500)
        .on(token)
        .opacity(1)
        .play();

    return Sequencer.EffectManager.endEffects({ name: label, object: token });
}

export const levitation = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autorec.register("levitating", "effect", "eskie.effect.levitation", DEFAULT_CONFIG, "0.0.0", "Levitating");
