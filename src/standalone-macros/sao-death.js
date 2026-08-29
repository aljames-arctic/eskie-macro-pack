// Standalone Macro: Sword Art Online Death (Glass Polygon Shatter)
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'SAO Death' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0] ?? game.user.targets.first();
if (!token) return ui.notifications.warn("Please select or target the token to shatter!");

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

const tokenWidth = token.document?.width ?? 1;
const tokenRotation = token.document?.rotation ?? token.rotation ?? 0;

const sequence = new Sequence();

// Red error warning rings popping on dying avatar
sequence.effect()
    .file(closest("jaamod.spells_effects.antilife_shell"))
    .atLocation(token)
    .scaleToObject(2.5)
    .tint("#ff0000")
    .duration(800);

// Frosted blue crystal poly grid outline freeze over token
sequence.effect()
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .atLocation(token)
    .scaleToObject(1, { considerTokenScale: true })
    .filter("ColorMatrix", { hue: 180, saturate: 1, brightness: 2 })
    .filter("Glow", { color: 0x00f0ff, distance: 10 })
    .duration(1200)
    .fadeOut(400);

sequence.wait(600);

// Hide token document
sequence.animation()
    .on(token)
    .opacity(0);

// Explosive glass shards burst into geometric poly fragments
sequence.effect()
    .file(closest("eskie.particle.05.blue"))
    .atLocation(token)
    .size(tokenWidth * 3, { gridUnits: true })
    .filter("ColorMatrix", { hue: 180, brightness: 1.5 })
    .tint("#00f0ff")
    .zIndex(5);

sequence.effect()
    .file(closest("jb2a.markers.circle_of_stars.blue"))
    .atLocation(token)
    .scaleToObject(2.5)
    .playbackRate(1.5)
    .zIndex(6);

sequence.effect()
    .file(closest("eskie.particle.05.blue"))
    .atLocation(token)
    .size(tokenWidth * 4, { gridUnits: true })
    .duration(2000)
    .fadeOut(1500)
    .tint("#00e5ff");

await sequence.play();
