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
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: target });
if (activeEffects.length > 0 || (target.document?.opacity ?? 1) === 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: target });
    new Sequence().animation().on(target).opacity(1).play();
    return;
}

const closest = (path) => {
    if (typeof eskie !== "undefined" && eskie.util?.file?.closest) {
        return eskie.util.file.closest(path);
    }
    const apiClosest = game.modules.get("eskie-macros")?.api?.util?.closest;
    if (typeof apiClosest === "function") {
        return apiClosest(path);
    }
    return path;
};

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

sequence = sequence.effect()
    .name(label)
    .copySprite(target)
    .spriteRotation(-(target.document?.rotation ?? 0))
    .scaleToObject(1, { considerTokenScale: true })
    .duration(500)
    .scaleOut(0, 500, { ease: "easeInOutElastic" })
    .rotateOut(180, 300, { ease: "easeOutCubic" });

sequence = sequence.animation()
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

sequence = sequence.effect()
    .name(label)
    .copySprite(target)
    .spriteRotation(-(target.document?.rotation ?? 0))
    .scaleToObject(1, { considerTokenScale: true })
    .scaleIn(0, 500, { ease: "easeInOutElastic" })
    .rotateIn(180, 300, { ease: "easeOutCubic" })
    .duration(500)
    .waitUntilFinished(-250);

sequence = sequence.animation()
    .on(target)
    .opacity(1);

await sequence.play();
