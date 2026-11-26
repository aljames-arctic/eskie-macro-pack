//Last Updated: 1/27/2025
//Author: .eskie

import { closest } from "../../../../../lib/filemanager.js";

import { adapter } from "../../../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../../../utils/sound.js";
import { resolveMotionTarget, endEffectsAndMotions } from "../../../../utils/motion.js";
const DEFAULT_CONFIG = {
    id: 'Eagle Totemic Attunement',
    flight: {
        wingSize: 1.25,
        flaps: 2,
        sway: 1,
    },
    color: 'red',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function play(token: Token, config: any = {}) {
    const seq = await create(token, config);
    if (seq) { await seq.play(); }
}

function create(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, color, flight, sound } = mConfig;
    const { wingSize, flaps, sway } = flight;
    const label = `${id} - ${token.id}`;
    const motionToken = resolveMotionTarget(token);
    const gridSize = adapter.getGridSize();

    // Original lifted by -(0.5 + 0.1 * sway) GU over 1000ms (easeOutBack), then stepped across 6 values
    // spanning [0 .. 0.1 * sway] GU at 1000ms per step (6000ms full cycle).
    const hoverCenterY = -(0.5 + (0.05 * sway));
    const swayAmplitudePx = 0.05 * sway * gridSize;

    let seq = new Sequence();
    applySound(seq, sound);

    if (motionToken) {
        seq = seq
            .motion(motionToken)
            .name(label)
            .zIndex(2)
            .moveBy({ y: hoverCenterY }, { gridUnits: true, delay: 100, duration: 1000, ease: "easeOutBack", returnDuration: 500, easeOut: "easeInOutQuad" })
            .oscillate({
                period: 6000,
                waveform: "sine",
                delay: 100,
                fadeInDuration: 300,
                fadeOutDuration: 300,
                y: { amplitude: swayAmplitudePx, phase: Math.PI / 6 },
            })
            .persist();
    }

    seq = seq.effect()
      .name(label)
      .copySprite(token)
      .spriteRotation(-token.document.rotation)
      .attachTo(token, { bindAlpha: false, ignoreMotion: true })
      .scaleToObject(0.8, { considerTokenScale: true })
      .zIndex(0.1)
      .persist()
      .belowTokens()
      .filter("ColorMatrix", { brightness:0 })
      .filter("Blur", { blurX: 5, blurY: 10 })
      .opacity(0.65)

    .effect()
      .delay(400)
      .file(closest(`eskie.sound.roar.01`))
      .attachTo(token, { bindAlpha: false })
      .scaleToObject(3.5)
      .opacity(0.75)
      .randomRotation();
    
    if (flaps != 0) {
    seq = seq.effect()
      .name(label)
      .file(closest(`eskie.wings.bird.01`))
      .attachTo(token, { bindAlpha: false })
      .scaleToObject(3*wingSize)
      .playbackRate(2);
      if (flaps > 0) seq = seq.loopOptions({ loops: flaps, loopDelay:1000, endOnLastLoop:true });
      seq = seq.fadeIn(500, {ease:"easeOutCubic", delay:350})
      .fadeOut(500, {ease:"easeOutCubic"})
      .tint("#ff0000")
      .filter("ColorMatrix", {brightness:5, saturate: -1})
      .opacity(0.25)
      .zIndex(0)
      .persist()
    
    .effect()
      .name(label)
      .file(closest(`eskie.wings.bird.01`))
      .attachTo(token, { bindAlpha: false })
      .scaleToObject(3*wingSize)
      .playbackRate(2);
      if (flaps > 0) seq = seq.loopOptions({ loops: flaps, loopDelay:1000, endOnLastLoop:true });
      seq = seq.fadeIn(500, {ease:"easeOutCubic", delay:350})
      .fadeOut(500, {ease:"easeOutCubic"})
      .tint("#ff0000")
      .filter("ColorMatrix", {brightness:3, saturate: 1, hue:20})
      .opacity(1)
      .filter("Glow", { color: 0xFF0000, knockout:true, distance:5 })
      .zIndex(0)
      .persist();
    }

    seq = seq.effect()
      .name(label)
      .file(closest(`eskie.buff.loop.simple.${color}`))
      .attachTo(token, { bindAlpha: false })
      .scaleToObject(1)
      .opacity(0.5)
      .filter("ColorMatrix", {saturate: 1})
      .playbackRate(1)
      .fadeOut(500)
      .zIndex(0.2)
      .persist()
    
    .effect()
      .name(label)
      .file(closest(`eskie.aura.token.generic.02.${color}`))
      .attachTo(token, { bindAlpha: false })
      .scaleToObject(2.1)
      .zIndex(0.2)
      .timeRange(500, 2500)
      .persist();

    return seq;
}

async function stop(token: Token, config: any = {}) {
    const { id } = adapter.mergeObject(DEFAULT_CONFIG, config);
    const label = `${id} - ${token.id}`;

    return endEffectsAndMotions(token, label);
}

export const eagleAttunement = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};