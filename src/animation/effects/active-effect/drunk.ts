import { closest } from "../../../lib/filemanager.js";
import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
import { resolveMotionTarget, endEffectsAndMotions } from "../../utils/motion.js";
import { blur } from "../../scene-overlays/status-blur.js";
import { log } from '../../../lib/logger.js';

/* **
   Originally Published: 4/14/2023
   Author: EskieMoh#2969 
   Update Author: bakanabaka
** */

const DEFAULT_CONFIG = {
    id: 'drunk',
    duration: -1,
    overlay: {
        applyPC: true,
        applyGM: false,
    },
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token: Token, config: any = {}) {
    const { id, duration, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);
    const tokenWidth = adapter.getTokenDimensions(token).widthUnits;
    const label = `${id} - ${token.id}`;
    const motionToken = resolveMotionTarget(token);

    let drunkEffect = new Sequence();
    applySound(drunkEffect, sound);

    // Sway and bob the native token sprite directly so attached/targeted effects track it
    if (motionToken) {
        let swayMotion = drunkEffect.motion(motionToken).name(label);
        if (duration > 0) {
            const ramp = Math.min(250, Math.max(1, Math.floor(duration / 2)));
            const hold = Math.max(0, duration - (ramp * 2));
            swayMotion = swayMotion
                .moveBy(
                    [
                        { v: { x: 0, y: 0 } },
                        { v: { x: 0, y: 10 }, duration: ramp, inEase: "easeOutQuad", hold },
                        { v: { x: 0, y: 0 }, duration: ramp, inEase: "easeInQuad" },
                    ],
                    { return: false }
                )
                .oscillate({
                    period: 5000,
                    waveform: "sine",
                    duration,
                    fadeOutDuration: ramp,
                    x: { amplitude: 20, phase: 1.5 * Math.PI },
                    rotation: { amplitude: 10, phase: 1.5 * Math.PI },
                })
                .oscillate({
                    period: 5000,
                    waveform: "triangle",
                    duration,
                    fadeOutDuration: ramp,
                    y: { amplitude: 10, phase: 1.5 * Math.PI },
                });
        } else {
            swayMotion = swayMotion
                .moveBy({ y: 10 }, { duration: 250, ease: "easeOutQuad", returnDuration: 250, easeOut: "easeInQuad" })
                .oscillate({
                    period: 5000,
                    waveform: "sine",
                    fadeOutDuration: 250,
                    x: { amplitude: 20, phase: 1.5 * Math.PI },
                    rotation: { amplitude: 10, phase: 1.5 * Math.PI },
                })
                .oscillate({
                    period: 5000,
                    waveform: "triangle",
                    fadeOutDuration: 250,
                    y: { amplitude: 10, phase: 1.5 * Math.PI },
                })
                .persist();
        }
        drunkEffect = swayMotion;
    }

    drunkEffect = drunkEffect
        // Drunk bubbles effect
        .effect()
        .file(closest('eskie.emote.drunk_bubbles.01'))
        .zIndex(0)
        .name(label)
        .delay(0, 500)
        .atLocation(token, { offset: { x: -0.2 * tokenWidth, y: -0.3 * tokenWidth }, gridUnits: true });
    drunkEffect = (duration > 0) ? drunkEffect.duration(duration) : drunkEffect.persist();
    drunkEffect = drunkEffect
        .scaleToObject(0.7)
        .zeroSpriteRotation()
        .loopProperty('spriteContainer', 'position.x', { from: 0, to: -0.02, duration: 2000, pingPong: true, gridUnits: true, ease: "linear" })
        .loopProperty('spriteContainer', 'position.y', { from: 0.15, to: -0.15, duration: 6000, pingPong: false, gridUnits: true, ease: "easeOutSine" })
        .loopProperty('sprite', "width", { from: 0, to: 0.1, duration: 6000, pingPong: false, gridUnits: true, ease: "easeOutCubic" })
        .loopProperty('sprite', "height", { from: 0, to: 0.1, duration: 6000, pingPong: false, gridUnits: true, ease: "easeOutCubic" })
        .loopProperty("alphaFilter", "alpha", { values: [-1, 1, 1, 1, 1, -1], duration: 1000, pingPong: true, ease: "easeOutCubic" })
        .attachTo(token, { bindAlpha: false, bindRotation: false })
        .private()

        // Blush effect attached to token (tracks motion X/Y automatically; keeps rotational sway)
        .effect()
        .file(closest('eskie.emote.blush.01'))
        .zIndex(0)
        .name(label)
        .opacity(0.85)
        .scaleToObject(0.5)
        .loopProperty('sprite', "rotation", { from: -10, to: 10, duration: 2500, pingPong: true, ease: "easeInOutSine" });
    drunkEffect = (duration > 0) ? drunkEffect.duration(duration) : drunkEffect.persist();
    drunkEffect = drunkEffect
        .atLocation(token)
        .spriteOffset({ x: -0.15 * tokenWidth, y: 0.15 * tokenWidth }, { gridUnits: true, local: true })
        .attachTo(token, { bindAlpha: false, bindRotation: true })
        .private();

    return drunkEffect;
}

async function play(token: Token, config: any = {}) {
    const { overlay } = adapter.mergeObject(DEFAULT_CONFIG, config);

    const seq = await create(token, config);
    if (seq) await seq.play();

    if (overlay.applyPC || overlay.applyGM) {
        const SEQUENCER_DEFAULT_OPACITY = 50;
        if (!overlay.applyGM && game.settings.get('sequencer', 'user-effect-opacity') === SEQUENCER_DEFAULT_OPACITY) {
            log.warn('Sequencer user-effect-opacity is set to default (50). This may cause the blurred vision effect to appear for GMs as well. Consider lowering this if this is not intended.');
        }

        const owners = adapter.getTokenOwners(token, { applyPC: overlay.applyPC, applyGM: overlay.applyGM });
        blur.drunk.play(owners);
    }
}

async function stop(token: Token, config: any = {}) {
    const { id, overlay } = adapter.mergeObject(DEFAULT_CONFIG, config);
    if (overlay.applyPC || overlay.applyGM) {
        const owners = adapter.getTokenOwners(token, { applyPC: overlay.applyPC, applyGM: overlay.applyGM });
        blur.drunk.stop(owners)
    }

    const label = `${id} - ${token.id}`;
    return endEffectsAndMotions(token, label);
}

export const drunk = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register("drunk", "effect", "eskie.effect.emote.drunk", DEFAULT_CONFIG, "0.0.2", "Drunk");
