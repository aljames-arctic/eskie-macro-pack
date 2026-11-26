// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
import { resolveMotionTarget, endEffectsAndMotions } from "../../utils/motion.js";
const FLYING_TAG = 'Flying';
const EFFECT_NAME = 'Fly';

export const DEFAULT_CONFIG = {
    id: 'AerodyneVehicle',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { sound } = mConfig;

    const tokenRotation = adapter.getTokenRotation(token);
    const { widthPx: w, heightPx: h } = adapter.getTokenDimensions(token);
    const gridSize = adapter.getGridSize();
    const motionToken = resolveMotionTarget(token);

    // Original lifted to -0.2 GU over 500ms, then ping-ponged linearly between 0 and -20px every 2500ms.
    const baseHoverY = -0.2 * gridSize;

    const seq = new Sequence();
    applySound(seq, sound);
    seq
        .effect()
        .file(closest('eskie.smoke.07.white'))
        .atLocation(token, { ignoreMotion: true })
        .randomRotation()
        .scale(1.2)
        .opacity(0.25)
        .loopProperty('sprite', 'scale.x', { from: 1, to: 1.5, duration: 900 })
        .loopProperty('sprite', 'scale.y', { from: 1, to: 1.5, duration: 900 })
        .belowTokens();

    if (motionToken) {
        seq
            .motion(motionToken)
            .name(EFFECT_NAME)
            .zIndex(2)
            .moveBy(
                [
                    { v: { x: 0, y: 0 } },
                    { v: { x: 0, y: baseHoverY }, duration: 500, inEase: 'linear' },
                    { v: { x: 0, y: baseHoverY - 10 }, duration: 1250, inEase: 'linear' },
                ],
                { returnDuration: 500, ease: 'linear' }
            )
            .oscillate({
                period: 5000,
                waveform: 'triangle',
                delay: 1750,
                fadeOutDuration: 300,
                y: { amplitude: -10 },
            })
            .persist();
    }

    seq
        .effect()
        .copySprite(token)
        .spriteRotation(-tokenRotation)
        .name(EFFECT_NAME)
        .atLocation(token, { ignoreMotion: true })
        .size({ width: w, height: h })
        .duration(1000)
        .opacity(0.5)
        .filter('ColorMatrix', { brightness: -1 })
        .filter('Blur', { blurX: 5, blurY: 10 })
        .attachTo(token, { offset: { x: 0, y: 0.25 }, gridUnits: true, bindRotation: true, bindAlpha: false, ignoreMotion: true })
        .animateProperty('sprite', 'rotation', { from: 0, to: 0, duration: 0 })
        .zIndex(0)
        .persist()

        // Thrusters automatically track the vehicle's hover motion X/Y displacement
        .effect()
        .file(closest('jb2a.dancing_lights.01.blueteal'))
        .scaleToObject(0.25)
        .name(EFFECT_NAME)
        .atLocation(token, { offset: { x: 1.2, y: 1.2 }, gridUnits: true, local: true })
        .attachTo(token, { bindAlpha: false })
        .filter('ColorMatrix', { saturate: 1 })
        .filter('Blur', { blurX: 10, blurY: 10 })
        .persist()
        .playbackRate(5)
        .spriteRotation(tokenRotation)
        .zIndex(0)

        .effect()
        .file(closest('jb2a.dancing_lights.01.blueteal'))
        .scaleToObject(0.25)
        .name(EFFECT_NAME)
        .atLocation(token, { offset: { x: -1.2, y: 1.2 }, gridUnits: true, local: true })
        .attachTo(token, { bindAlpha: false })
        .filter('ColorMatrix', { saturate: 1 })
        .filter('Blur', { blurX: 10, blurY: 10 })
        .persist()
        .playbackRate(5)
        .spriteRotation(tokenRotation)
        .zIndex(0)

        .effect()
        .file(closest('jb2a.dancing_lights.01.blueteal'))
        .scaleToObject(0.25)
        .name(EFFECT_NAME)
        .atLocation(token, { offset: { x: 1.2, y: -1.2 }, gridUnits: true, local: true })
        .attachTo(token, { bindAlpha: false })
        .filter('ColorMatrix', { saturate: 1 })
        .filter('Blur', { blurX: 10, blurY: 10 })
        .persist()
        .playbackRate(5)
        .spriteRotation(tokenRotation)
        .zIndex(0)

        .effect()
        .file(closest('jb2a.dancing_lights.01.blueteal'))
        .scaleToObject(0.25)
        .name(EFFECT_NAME)
        .atLocation(token, { offset: { x: -1.2, y: -1.2 }, gridUnits: true, local: true })
        .attachTo(token, { bindAlpha: false })
        .filter('ColorMatrix', { saturate: 1 })
        .filter('Blur', { blurX: 10, blurY: 10 })
        .persist()
        .playbackRate(5)
        .spriteRotation(tokenRotation)
        .zIndex(0);

    return seq;
}

async function play(token: Token, config: any = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

async function stop(token: Token, config: any = {}) {
    await Tagger.removeTags(token, FLYING_TAG);
    await endEffectsAndMotions(token, EFFECT_NAME);
    return new Sequence()
        .effect()
        .file(closest('eskie.smoke.07.white'))
        .atLocation(token, { ignoreMotion: true })
        .randomRotation()
        .scale(1.2)
        .belowTokens()
        .opacity(0.25)
        .loopProperty('sprite', 'scale.x', { from: 1, to: 1.5, duration: 900 })
        .loopProperty('sprite', 'scale.y', { from: 1, to: 1.5, duration: 900 })
        .belowTokens()
        .play();
}

export const aerodyneVehicle = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
