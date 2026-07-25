// Standalone Macro: Psychic Teleportation
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Psychic Teleportation' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const label = "Psychic Teleportation";
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    new Sequence().animation().on(token).opacity(1).play();
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

const portalEntry = Sequencer.Database.getEntry(closest("jb2a.portals.vertical.vortex.purple"));
const portalPath = typeof portalEntry === "string" ? portalEntry : (portalEntry?.file ?? portalEntry?.files?.[0]);

const position = await Sequencer.Crosshair.show({
    size: token.document?.width ?? 1,
    icon: portalPath,
    label: label
});

if (!position || position.cancelled) return;

const sequence = new Sequence()
    .animation()
        .on(token)
        .opacity(0)

    .effect()
        .name(label)
        .file(closest("jb2a.dagger.throw.01.white"))
        .atLocation(token)
        .stretchTo(position)
        .filter("ColorMatrix", { saturate: -1, brightness: 5 })
        .filter("Glow", { color: 0x2EB8C1, distance: 3, innerStrength: 2 })
        .opacity(0.9)
        .duration(1000)

    .effect()
        .file(closest("jb2a.impact.010.blue"))
        .atLocation(token)
        .scaleToObject(2)
        .scaleOut(0, 250)
        .randomRotation()

    .effect()
        .file(closest("jb2a.particles.outward.blue.01.03"))
        .filter("ColorMatrix", { saturate: 1, brightness: 5 })
        .filter("Glow", { color: 0x2EB8C1, distance: 3, innerStrength: 2 })
        .atLocation(token)
        .scaleToObject(2)
        .randomRotation()
        .scaleIn(0.25, 250)
        .fadeOut(2500)
        .duration(3000)

    .effect()
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .atLocation(token)
        .scaleToObject(1.25)
        .opacity(0.25)

    .effect()
        .file(closest("jb2a.particles.outward.blue.01.03"))
        .atLocation(token)
        .scaleToObject(1.25)
        .filter("ColorMatrix", { saturate: -1, brightness: 10 })
        .opacity(0.25)
        .fadeOut(500)

    .effect()
        .copySprite(token)
        .spriteRotation(-token.document.rotation)
        .atLocation(token)
        .scaleToObject(1, { considerTokenScale: true })
        .filter("ColorMatrix", { saturate: -1, brightness: 10 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .duration(500)
        .scaleOut(0, 500, { ease: "easeOutCubic" })
        .fadeOut(500)

    .animation()
        .on(token)
        .teleportTo(position, { offset: { x: -1, y: -1 } })
        .snapToGrid()
        .waitUntilFinished()

    .wait(1000)

    .thenDo(function () {
        Sequencer.EffectManager.endEffects({ name: label, object: token });
    })

    .effect()
        .file(closest("jb2a.impact.010.blue"))
        .atLocation(token)
        .scaleToObject(2)
        .scaleIn(0, 250)
        .randomRotation()

    .effect()
        .file(closest("jb2a.particles.outward.blue.01.03"))
        .filter("ColorMatrix", { saturate: 1, brightness: 5 })
        .filter("Glow", { color: 0x2EB8C1, distance: 3, innerStrength: 2 })
        .atLocation(token)
        .scaleToObject(2)
        .randomRotation()
        .scaleIn(0.25, 250)
        .fadeOut(2500)
        .duration(3000)

    .effect()
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .atLocation(token)
        .scaleToObject(1.25)
        .opacity(0.25)

    .effect()
        .file(closest("jb2a.particles.outward.blue.01.03"))
        .atLocation(token)
        .scaleToObject(1.25)
        .filter("ColorMatrix", { saturate: -1, brightness: 10 })
        .opacity(0.25)
        .fadeOut(500)

    .effect()
        .copySprite(token)
        .spriteRotation(-token.document.rotation)
        .atLocation(token)
        .scaleToObject(1, { considerTokenScale: true })
        .filter("ColorMatrix", { saturate: -1, brightness: 10 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .duration(500)
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .fadeOut(500)

    .waitUntilFinished(-400)

    .animation()
        .on(token)
        .opacity(1);

await sequence.play();
