// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

import { closest } from "../../../lib/filemanager.js";

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
import { resolveMotionTarget, computeCenterDelta } from "../../utils/motion.js";
const DEFAULT_CONFIG = {
    position: undefined,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(target: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const motionTarget = resolveMotionTarget(target);
    const hasMove = Boolean(mConfig.position) && (() => {
        const d = computeCenterDelta(target, mConfig.position);
        return Math.hypot(d.x, d.y) >= 1;
    })();

    let sequence = new Sequence();
    applySound(sequence, mConfig.sound);

    // Vortex out
    sequence = sequence.effect()
        .file(closest("jb2a.portals.horizontal.vortex.purple"))
        .atLocation(target)
        .scaleToObject(2.5)
        .rotateIn(-360, 500, { ease: "easeOutCubic" })
        .rotateOut(360, 500, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeInOutCirc" })
        .scaleOut(0, 600, { ease: "easeOutCubic" })
        .opacity(1)
        .duration(2000)
        .belowTokens()
        .waitUntilFinished(-500);

    if (motionTarget) {
        let outMotion = sequence
            .motion(motionTarget)
            .scaleTo(0.01, { duration: 500, ease: "easeInOutElastic", return: false })
            .rotateBy(180, { delay: 200, duration: 300, ease: "easeOutCubic", return: false });
        if (hasMove) {
            outMotion = outMotion.persistUntilUpdate();
        } else {
            outMotion = outMotion.fadeTo(0, { delay: 450, duration: 50, return: false });
        }
        sequence = outMotion;
    }

    sequence = sequence
        .wait(500)
        .animation()
        .on(target)
        .opacity(0);

    if (mConfig.position) {
        sequence = sequence.animation()
            .on(target)
            .teleportTo(mConfig.position, { offset: { x: -1, y: -1 } })
            .snapToGrid();
    }

    // Vortex in
    sequence = sequence.effect()
        .file(closest("jb2a.portals.horizontal.vortex.purple"))
        .atLocation(mConfig.position ?? target)
        .scaleToObject(2.5)
        .rotateIn(-360, 500, { ease: "easeOutCubic" })
        .rotateOut(360, 500, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeInOutCirc" })
        .scaleOut(0, 600, { ease: "easeOutCubic" })
        .opacity(1)
        .duration(2000)
        .waitUntilFinished(-500);

    sequence = sequence.animation()
        .on(target)
        .opacity(1);

    if (motionTarget) {
        sequence = sequence
            .motion(motionTarget)
            .scaleTo(
                [
                    { v: 0.01 },
                    { v: 1, duration: 500, inEase: "easeInOutElastic" },
                ],
                { return: false }
            )
            .rotateBy(
                [
                    { v: 180 },
                    { v: 0, duration: 300, inEase: "easeOutCubic" },
                ],
                { return: false }
            )
            .waitUntilFinished(-250);
    }

    return sequence;
}

async function play(target: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { position } = mConfig;
    const { widthUnits: targetWidth } = adapter.getTokenDimensions(target);
    const crosshairConfig = {
        size: targetWidth,
        icon: 'icons/magic/air/wind-vortex-swirl-blue.webp',
        label: 'Vortex Warp',
        tag: 'Vortex Warp',
        drawIcon: true,
        drawOutline: true,
        interval: targetWidth % 2 === 0 ? 1 : -1,
    };

    if (!position) {
        mConfig.position = await Sequencer.Crosshair.show(crosshairConfig);
        if (!mConfig.position.x) return;
    }

    const sequence = await create(target, mConfig);
    if (sequence) { return sequence.play(); }
}

export const vortexWarp = {
    create,
    play,
    default_config: DEFAULT_CONFIG,
};
