// Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";
import { settingsOverride } from "../../../lib/settings.js";
import { autorec, CONCENTRATING } from "../../../adapters/modules/autorec/autorec-module-adapter.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";

import { adapter } from "../../../adapters/index.js";
const DEFAULT_CONFIG = {
    id: 'Flurry Of Blows',
    color: "yellow",
    sound: {
        punch1: {
            ...DEFAULT_SOUND_CONFIG,
            enable: true,
            volume: 0.5,
            delay: 125,
            file: 'psfx.impacts.bludgeoning',
            repeats: [7, 250, 250],
        },
        punch2: {
            ...DEFAULT_SOUND_CONFIG,
            enable: true,
            volume: 0.5,
            delay: 250,
            file: 'psfx.impacts.bludgeoning',
            repeats: [7, 250, 250],
        }
    }
};

async function create(token, target, config = {}) {
    config = settingsOverride(config);
    const { color, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);
    let seq = new Sequence();

    applySound(seq, sound.punch1);
    seq = seq.effect()
        .delay(125)
        .file(closest(`jb2a.melee_generic.creature_attack.fist.001.${color}`))
        .atLocation(token, {offset:{x:-0.75 , y:-0.2}, gridUnits:true, local:true})
        .rotateTowards(target,{randomOffset:0.15})
        .scaleToObject(2.5)
        .playbackRate(2.5)
        .spriteOffset({x:-0.05-(token.document.width-1) , y:-0.18*token.document.width}, {gridUnits:true})
        .repeats(7,250,250)
        .zIndex(1);

    applySound(seq, sound.punch2);
    seq = seq.effect()
        .delay(250)
        .file(closest(`jb2a.melee_generic.creature_attack.fist.001.${color}`))
        .atLocation(token, {offset:{x:-0.75 , y:0.2}, gridUnits:true, local:true})
        .rotateTowards(target,{randomOffset:0.15})
        .scaleToObject(2.5)
        .playbackRate(2.5)
        .spriteOffset({x:-0.05-(token.document.width-1) , y:0.18*token.document.width}, {gridUnits:true})
        .repeats(7,250,250)
        .mirrorY()
        .zIndex(1);

    seq = seq.wait(250);

    seq = seq.effect()
        .file(closest("jb2a.impact.009.orange"))
        .atLocation(target,{randomOffset:1})
        .size(token.document.width*1.25, {gridUnits:true})
        .repeats(14,125,125)
        .randomRotation();

    seq = seq.effect()
        .copySprite(target)
        .spriteRotation(-target.document.rotation)
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .fadeIn(200)
        .fadeOut(200)
        .loopProperty('spriteContainer', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true})
        .duration(1750)
        .opacity(0.25);

    return seq;
}

async function play(token, target, config = {}) {
    const seq = await create(token, target, config);
    if (seq) { return seq.play(); }
}

export const flurryOfBlows = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};

autorec.register("flurryOfBlows", "melee-target", "eskie.effect.flurryOfBlows", DEFAULT_CONFIG, "0.0.1", "Flurry Of Blows");

