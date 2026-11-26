import { closest } from '../../../lib/filemanager.js';
import { template as templatelib } from '../../../lib/templates.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { resolveMotionTarget, computeCenterDelta } from '../../utils/motion.js';

//Last Updated: 4/30/2024
//Author: EskieMoh#2969

const DEFAULT_CONFIG = {
    id: 'hitTheDirt',
    label: 'Hit the Dirt',
    sound: { ...DEFAULT_SOUND_CONFIG }
};

async function create(token: Token, config: any = {}, options: any = {}) {
    if (options?.type === 'aefx') return;
    const { template, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);

    const cfg = {
        radius: 1,
        icon: 'icons/magic/control/silhouette-fall-slip-prone.webp',
        label: 'Hit The Dirt!'
    };
    let [position, _] = await templatelib.getPosition(template, cfg);
    if (!position || position.cancelled) { return; }

    const tokenRotation = adapter.getTokenRotation(token);
    const motionToken = resolveMotionTarget(token);
    const diveDelta = computeCenterDelta(token, position);

    let seq = new Sequence();
    applySound(seq, sound);
    seq = seq
        .effect()
        .delay(100)
        .file(closest("eskie.smoke.06.white"))
        .atLocation(token, { ignoreMotion: true })
        .scaleToObject(1.1)
        .belowTokens()
        .playbackRate(1.5)
        .opacity(0.5)

        .effect()
        .copySprite(token)
        .spriteRotation(-tokenRotation)
        .atLocation(token, { ignoreMotion: true })
        .scaleToObject(0.85, { considerTokenScale: true })
        .moveTowards(position, { delay: 100, rotate: false, ease: "easeOutQuint" })
        .duration(1600)
        .belowTokens()
        .filter("ColorMatrix", { saturate: -1, brightness: 0 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(0.5)

        .effect()
        .delay(900)
        .file(closest("eskie.smoke.01.white"))
        .atLocation(position)
        .rotateTowards(token, { ignoreMotion: true })
        .scaleToObject(1.5)
        .belowTokens()
        .spriteOffset({ x: -1.25 }, { gridUnits: true })
        .spriteRotation(-180)
        .opacity(0.5);

    if (motionToken) {
        // Animate the token diving in a parabolic arc and rotating prone before committing DB state
        seq = seq
            .motion(motionToken)
            .moveBy(diveDelta, { delay: 100, duration: 1100, ease: "easeOutQuint", return: false })
            .moveBy(
                [
                    { v: { x: 0, y: 0 } },
                    { v: { x: 0, y: -0.8 }, duration: 550, inEase: "easeOutQuint" },
                    { v: { x: 0, y: 0 }, duration: 550, inEase: "easeOutQuad" },
                ],
                { delay: 100, gridUnits: true, return: false }
            )
            .rotateBy(90, { delay: 100, duration: 500, ease: "easeOutCubic", return: false })
            .persistUntilUpdate()
            .wait(1200);
    }

    // Update the actual token
    seq = seq
        .animation()
        .on(token)
        .teleportTo(position, { relativeToCenter: true })
        .rotate(tokenRotation + 90);
    return seq;
}

async function play(token: Token, config: any = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

function destroy(token: Token, config: any = {}) {
    const tokenRotation = adapter.getTokenRotation(token);
    let seq = new Sequence()
        .animation()
        .on(token)
        .rotate(tokenRotation - 90);
    return seq;
}

async function stop(token: Token, config: any = {}) {
    const seq = destroy(token, config);
    if (seq) return seq.play();
}

export const hitTheDirt = {
    create,
    play,
    destroy,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register("hitTheDirt", 'template', 'eskie.effect.hitTheDirt', DEFAULT_CONFIG, "0.0.1", "Hit the Dirt");
adapter.autorec.register("hitTheDirt", 'effect', 'eskie.effect.hitTheDirt', DEFAULT_CONFIG, "0.0.1", "Hit the Dirt");