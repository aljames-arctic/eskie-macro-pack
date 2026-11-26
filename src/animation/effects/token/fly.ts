// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
import { resolveMotionTarget, endEffectsAndMotions } from "../../utils/motion.js";
const DEFAULT_CONFIG = {
    id: "fly",
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, sound } = mConfig;
    const label = `${id} - ${token.id}`;
    const motionToken = resolveMotionTarget(token);
    const { widthPx, heightPx } = adapter.getTokenDimensions(token);

    // Original anchor({ x: 0.55, y: 0.9 }) shifted the sprite by (-0.05 * w, -0.4 * h),
    // lifted into place over 500ms, then ping-ponged linearly between 0 and -50px every 2500ms.
    const anchorOffsetX = -0.05 * widthPx;
    const anchorOffsetY = -0.4 * heightPx;

    let seq = new Sequence();
    applySound(seq, sound);
    seq = seq.effect()
        .file(closest("jb2a.misty_step.01.blue"))
        .atLocation(token, { ignoreMotion: true })
        .scaleToObject(1.75)
        .belowTokens();

    if (motionToken) {
        seq = seq.motion(motionToken)
            .name(label)
            .zIndex(2)
            .moveBy(
                [
                    { v: { x: 0, y: 0 } },
                    { v: { x: anchorOffsetX, y: anchorOffsetY }, duration: 500, inEase: "linear" },
                    { v: { x: anchorOffsetX, y: anchorOffsetY - 25 }, duration: 1250, inEase: "linear" },
                ],
                { returnDuration: 500, ease: "linear" }
            )
            .oscillate({
                period: 5000,
                waveform: "triangle",
                delay: 1750,
                fadeOutDuration: 300,
                y: { amplitude: -25 },
            })
            .persist();
    }

    seq = seq.effect()
        .copySprite(token)
        .spriteRotation(-token.document.rotation)
        .name(label)
        .atLocation(token, { ignoreMotion: true })
        .scaleToObject(0.9, { considerTokenScale: true })
        .duration(1000)
        .opacity(0.5)
        .belowTokens()
        .filter("ColorMatrix", { brightness: -1 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .attachTo(token, { bindAlpha: false, ignoreMotion: true })
        .zIndex(1)
        .persist();

    return seq;
}

async function play(token: Token, config: any = {}) {
    const seq = await create(token, config);
    if (seq) { return seq.play(); }
}

async function stop(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mConfig;
    const label = `${id} - ${token.id}`;

    return endEffectsAndMotions(token, label);
}

export const fly = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
