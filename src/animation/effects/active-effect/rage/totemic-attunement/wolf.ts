//Last Updated: 1/27/2025
//Author: .eskie

import { closest } from "../../../../../lib/filemanager.js";

import { adapter } from "../../../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../../../utils/sound.js";
import { resolveMotionTarget } from "../../../../utils/motion.js";
const DEFAULT_CONFIG = {
    id: 'Wolf Totemic Attunement',
    color: 'red',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function play(token: Token, target: Token, config: any = {}) {
    const seq = await create(token, target, config);
    if (seq) { await seq.play(); }
}

function create(token: Token, target: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, color, sound } = mConfig;
    const label = `${id} - ${token.id}`;

    const tokenCenter = adapter.getCenter(token);
    const targetCenter = adapter.getCenter(target);
    const tokenDim = adapter.getTokenDimensions(token);
    const targetRotation = adapter.getTokenRotation(target);
    const motionToken = resolveMotionTarget(token);
    const motionTarget = resolveMotionTarget(target);

    const mid = {
        x: (targetCenter.x - tokenCenter.x) * 0.25,
        y: (targetCenter.y - tokenCenter.y) * 0.25,
    };

    const back = {
        x: (targetCenter.x - tokenCenter.x) * -0.25,
        y: (targetCenter.y - tokenCenter.y) * -0.25,
    };

    const seq = new Sequence();
    applySound(seq, sound);
    seq
        .effect()
            .delay(100)
            .file(closest(`jb2a.bite.400px.${color}`))
            .atLocation(target)
            .scaleToObject(3)
            .belowTokens()
            .tint("#ff0000")
            .opacity(0.8)

        .effect()
            .delay(150)
            .copySprite(target)
            .spriteRotation(-targetRotation)
            .attachTo(target)
            .scaleToObject(1, { considerTokenScale: true })
            .duration(1000) 
            .fadeOut(500)
            .loopProperty('spriteContainer', 'position.x', { from: -0.05, to: 0.05, duration: 25, gridUnits: true, pingPong: true })
            .tint("#ff0000")
            .opacity(0.35)  

        .effect()
            .delay(200)
            .file(closest(`jb2a.impact.008.${color}`))
            .atLocation(target, { offset: { x: -mid.x, y: -mid.y } })
            .size(tokenDim.widthUnits + 1, { gridUnits: true })
            .zIndex(1)

        .effect()
            .name(label)  
            .file(closest(`eskie.buff.loop.simple.${color}`))
            .attachTo(token, { offset: { y: -0.05 }, gridUnits: true, bindAlpha: false })
            .scaleToObject(1)
            .opacity(0.5)
            .filter("ColorMatrix", { saturate: 1 })
            .playbackRate(1)
            .fadeOut(500)
            .duration(1600) 
            .zIndex(0.2)

        .effect()
            .file(closest(`eskie.aura.token.generic.02.${color}`))
            .name(label)
            .attachTo(token, { bindAlpha: false })
            .scaleToObject(2.1)
            .startTime(500)
            .duration(2000)
            .zIndex(0.3);

    if (motionToken) {
        seq
            .motion(motionToken)
            .zIndex(0.1)
            .moveBy(
                [
                    { v: { x: 0, y: 0 } },
                    { v: mid, duration: 250, inEase: "easeOutExpo", hold: 550 },
                    { v: back, duration: 250, inEase: "easeOutExpo" },
                    { v: { x: 0, y: 0 }, duration: 250, inEase: "easeOutSine" },
                ],
                { delay: 200, return: false }
            );
    }

    seq
        .wait(900)

        .canvasPan()
            .shake({ duration: 1100, strength: 1, rotation: false, fadeOut: 500 })

        .effect()
            .file(closest(`eskie.sound.roar.01`))
            .atLocation(target, { offset: { x: -mid.x, y: -mid.y } })
            .size(tokenDim.widthUnits + 5, { gridUnits: true })

        .effect()
            .copySprite(target)
            .spriteRotation(-targetRotation)
            .attachTo(target, { bindAlpha: false, bindRotation: false, local: false, ignoreMotion: true })
            .scaleToObject(0.9, { considerTokenScale: true })
            .zIndex(0.1)
            .belowTokens()
            .filter("ColorMatrix", { brightness: 0 })
            .filter("Blur", { blurX: 5, blurY: 10 })
            .opacity(0.65)
            .duration(1200)

        .effect()
            .delay(100)
            .file(closest(`eskie.damage.piercing.01.${color}`))
            .attachTo(target, { bindAlpha: false, bindRotation: false, ignoreMotion: true })
            .scaleToObject(1.5)
            .opacity(1)
            .zIndex(1)
            .belowTokens()
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.5, duration: 500, ease: "easeOutCubic", gridUnits: true })
            .filter("ColorMatrix", { saturate: 1 });

    if (motionTarget) {
        seq
            .motion(motionTarget)
            .moveBy(
                [
                    { v: { x: 0, y: 0 } },
                    { v: { x: 0, y: -0.5 }, duration: 500, inEase: "easeOutCubic" },
                    { v: { x: 0, y: 0 }, duration: 250, inEase: "easeOutCubic" },
                ],
                { gridUnits: true, delay: 100, return: false }
            )
            .rotateBy(90, {
                delay: 100,
                duration: 250,
                ease: "easeOutCubic",
                return: false,
            })
            .persistUntilUpdate();
    }

    seq
        .wait(700)

        .effect()
            .file(closest(`eskie.smoke.03.tan`))
            .attachTo(target, { bindAlpha: false, bindRotation: false, ignoreMotion: true })
            .scaleToObject(2)
            .opacity(0.8)
            .belowTokens()

        .animation()
            .delay(300)
            .on(target)
            .rotate(targetRotation + 90);

    return seq;
}

export const wolfAttunement = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};