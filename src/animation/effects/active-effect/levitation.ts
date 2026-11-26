// Original Author: Mia Del'Mori
// Updated By: Eskie
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
import { resolveMotionTarget, endEffectsAndMotions } from "../../utils/motion.js";
const DEFAULT_CONFIG = {
    id: 'levitation',
    tint: '#00b3ff',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

function create(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, tint, sound } = mConfig;
    const label = `${id} - ${token.id}`;
    const gridSize = adapter.getSceneDimensions().size;
    const floatOffset = gridSize / 9;
    const motionToken = resolveMotionTarget(token);

    const sequence = new Sequence();
    applySound(sequence, sound);

    // Levitating token motion (exact 1:1 lift, rock, horizontal sway, and vertical bob)
    if (motionToken) {
        sequence
            .motion(motionToken)
            .name(label)
            .zIndex(2)
            .moveBy({ y: -0.6 }, { gridUnits: true, duration: 2000, ease: "easeOutCubic", returnDuration: 500, easeOut: "easeInOutQuad" })
            .oscillate({ period: 2200, waveform: "sine", fadeInDuration: 500, fadeOutDuration: 500, rotation: { amplitude: 10, phase: 1.5 * Math.PI } })
            .oscillate({ period: 4000, waveform: "sine", fadeInDuration: 500, fadeOutDuration: 500, x: { amplitude: floatOffset, phase: 1.5 * Math.PI } })
            .oscillate({ period: 6000, waveform: "sine", fadeInDuration: 500, fadeOutDuration: 500, y: { amplitude: floatOffset, phase: 1.5 * Math.PI } })
            .persist();
    }

    // Bless loop effect (stays grounded beneath levitating token)
    sequence
        .effect()
        .name(label)
        .atLocation(token, { ignoreMotion: true })
        .attachTo(token, { bindAlpha: false, ignoreMotion: true })
        .file(closest("jb2a.bless.200px.loop.blue"))
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(2)
        .tint(tint)
        .persist()

    // Wind stream effect (stays grounded beneath levitating token)
    .effect()
        .name(label)
        .atLocation(token, { ignoreMotion: true })
        .attachTo(token, { bindAlpha: false, ignoreMotion: true })
        .file(closest("jb2a.wind_stream.200.white"))
        .fadeIn(500)
        .fadeOut(500)
        .rotate(90)
        .tint(tint)
        .scaleToObject(1)
        .belowTokens()
        .persist()

    // Levitating token border (tracks motion X/Y displacement automatically; keeps rotational sync)
    .effect()
        .name(label)
        .attachTo(token, { bindAlpha: false })
        .file(closest("jb2a.token_border.circle.static.blue.012"))
        .fadeIn(500)
        .fadeOut(500)
        .scaleToObject(2)
        .belowTokens()
        .loopProperty('sprite', "rotation", { from: -10, to: 10, duration: 1100, pingPong: true, ease: "easeInOutSine" })
        .zIndex(1)
        .persist();

    return sequence;
}

async function play(token: Token, config: any = {}) {
    const sequence = create(token, config);
    if (sequence) return sequence.play();
}

async function stop(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mConfig;
    const label = `${id} - ${token.id}`;

    return endEffectsAndMotions(token, label);
}

export const levitation = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register("levitating", "effect", "eskie.effect.levitation", DEFAULT_CONFIG, "0.0.1", "Levitating");
