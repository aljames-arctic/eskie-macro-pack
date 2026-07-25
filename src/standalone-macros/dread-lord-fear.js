// Standalone Macro: Dread Lord Fear
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Dread Lord Fear' macro requires the 'Sequencer' module to be installed and active!");
}

const target = game.user.targets.first() ?? canvas.tokens.controlled[0];
if (!target) return ui.notifications.warn("Please select or target a token to terrify!");

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

const targetRotation = target.document?.rotation ?? target.rotation ?? 0;
const targetWidth = target.document?.width ?? 1;
const sequence = new Sequence();

sequence.effect()
    .file(closest("jb2a.toll_the_dead.red.skull_smoke"))
    .attachTo(target)
    .scaleToObject(1.65, { considerTokenScale: true })
    .filter("ColorMatrix", { saturate: 0.25, hue: -5 })
    .tint("#e51e19")
    .zIndex(1);

sequence.effect()
    .copySprite(target)
    .spriteRotation(-targetRotation)
    .attachTo(target)
    .scaleToObject(1, { considerTokenScale: true })
    .fadeIn(500)
    .fadeOut(2000)
    .loopProperty("spriteContainer", "position.x", { from: -0.05, to: 0.05, duration: 55, pingPong: true, gridUnits: true })
    .filter("ColorMatrix", { saturate: -1, brightness: 0.5 })
    .duration(5000)
    .opacity(0.65)
    .zIndex(0.1);

sequence.effect()
    .file(closest("jb2a.particles.outward.red.01.03"))
    .attachTo(target, { offset: { y: 0.1 }, gridUnits: true, bindRotation: false })
    .size(1 * targetWidth, { gridUnits: true })
    .duration(1000)
    .fadeOut(800)
    .scaleIn(0, 1000, { ease: "easeOutCubic" })
    .animateProperty("sprite", "width", { from: 0, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutBack" })
    .animateProperty("sprite", "height", { from: 0, to: 1.0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
    .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.6, duration: 1000, gridUnits: true })
    .filter("ColorMatrix", { saturate: 1, hue: 20 })
    .zIndex(0.3);

await sequence.play();
