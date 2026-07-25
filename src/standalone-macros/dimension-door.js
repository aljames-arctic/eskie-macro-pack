// Standalone Macro: Dimension Door
// Original Author: Unknown (from Discord animations)
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Dimension Door' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const label = "Dimension Door";
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

const tokenWidth = token.document?.width ?? 1;
const tokenHeight = token.document?.height ?? 1;

const sequence = new Sequence()
    .animation()
        .on(token)
        .opacity(0)

    .effect()
        .name(label)
        .file(closest("jb2a.fireball.beam.purple"))
        .atLocation(token)
        .stretchTo(position)
        .belowTokens()
        .playbackRate(3)
        .startTime(2200)
        .opacity(0.5)
        .zIndex(0)

    .effect()
        .name(label)
        .file(closest("jb2a.portals.vertical.vortex.purple"))
        .atLocation(token)
        .rotateTowards(position)
        .belowTokens()
        .scaleOut(0, 400, { ease: "easeOutQuint" })
        .scale({ x: tokenWidth / 2, y: tokenHeight / 2 })
        .rotate(-90)
        .anchor({ x: 0.5, y: 0.8 })
        .duration(3000)
        .zIndex(1)
        .waitUntilFinished(-2000)

    .effect()
        .name(label)
        .file(closest("jb2a.portals.vertical.vortex.purple"))
        .atLocation(position)
        .rotateTowards(token)
        .rotate(90)
        .duration(3000)
        .scaleOut(0, 400, { ease: "easeOutQuint" })
        .scale({ x: tokenWidth / 2, y: tokenHeight / 2 })
        .anchor({ x: 0.5, y: 0.2 })
        .mirrorY()
        .belowTokens()
        .zIndex(1)

    .effect()
        .name(label)
        .file(closest("jb2a.side_impact.part.slow.spiral.pinkpurple"))
        .atLocation(position)
        .scale({ x: 0.125, y: 0.15 })
        .playbackRate(1.75)
        .rotateTowards(token)
        .rotate(180)
        .anchor({ x: 0.9, y: 0.5 })

    .animation()
        .on(token)
        .teleportTo(position, { offset: { x: -1, y: -1 } })
        .snapToGrid()
        .waitUntilFinished()

    .animation()
        .on(token)
        .opacity(1)
        .duration(500);

await sequence.play();
