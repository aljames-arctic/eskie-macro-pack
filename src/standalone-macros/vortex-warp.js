// Standalone Macro: Vortex Warp
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Vortex Warp' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please target a token to warp!");

const label = "Vortex Warp";
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: target }) ?? [];
const endedMotions = Sequencer.MotionManager.endMotions(target, { name: label });
if (activeEffects.length > 0 || endedMotions > 0 || (target.document?.opacity ?? 1) === 0) {
    await Sequencer.EffectManager.endEffects({ name: label, object: target });
    await new Sequence().animation().on(target).opacity(1).play();
    return;
}

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const targetWidth = target.document?.width ?? 1;
const gridSize = canvas.grid?.size ?? 100;
const crosshairConfig = {
    size: (target.w ?? (targetWidth * gridSize)) / gridSize,
    icon: 'icons/magic/air/wind-vortex-swirl-blue.webp',
    label: label,
    tag: label,
    drawIcon: true,
    drawOutline: true,
    interval: targetWidth % 2 === 0 ? 1 : -1,
    rememberControlled: true,
};

const position = await Sequencer.Crosshair.show(crosshairConfig);
if (!position || position.cancelled || !position.x) return;

const targetCenter = target.center ?? {
    x: target.x + (target.w ?? (targetWidth * gridSize)) / 2,
    y: target.y + (target.h ?? ((target.document?.height ?? 1) * gridSize)) / 2,
};
const hasMove = Math.hypot(position.x - targetCenter.x, position.y - targetCenter.y) >= 1;
const portalFile = closest("jb2a.portals.horizontal.vortex.purple");

let sequence = new Sequence();

// Vortex out
sequence = sequence.effect()
    .name(label)
    .file(portalFile)
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

let outMotion = sequence
    .motion(target)
    .name(label)
    .scaleTo(0.01, { duration: 500, ease: "easeInOutElastic", return: false })
    .rotateBy(180, { delay: 200, duration: 300, ease: "easeOutCubic", return: false });
if (hasMove) {
    outMotion = outMotion.persistUntilUpdate();
} else {
    outMotion = outMotion.fadeTo(0, { delay: 450, duration: 50, return: false });
}
sequence = outMotion;

sequence = sequence
    .wait(500)
    .animation()
    .on(target)
    .opacity(0);

sequence = sequence.animation()
    .on(target)
    .teleportTo(position, { offset: { x: -1, y: -1 } })
    .snapToGrid();

// Vortex in
sequence = sequence.effect()
    .name(label)
    .file(portalFile)
    .atLocation(position)
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

sequence = sequence
    .motion(target)
    .name(label)
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

await sequence.play();
