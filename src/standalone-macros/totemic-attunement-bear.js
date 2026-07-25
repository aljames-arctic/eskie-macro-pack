// Standalone Macro: Totemic Attunement - Bear
// Last Updated: 1/27/2025
// Author: .eskie
// Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Bear Totemic Attunement' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select your Barbarian token!");

const targets = Array.from(game.user.targets);
const affectTargets = targets.length > 0 ? targets : [token];

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

const id = "Bear Totemic Attunement";
const color = "red";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id} - ${tokenId}`;

const seq = new Sequence();

seq.effect()
    .name(label)
    .file(closest("eskie.sound.roar.01"))
    .attachTo(token)
    .scaleToObject(3.5)
    .opacity(0.75)
    .randomRotation()
    .repeats(8, 250, 250)
    .zIndex(1);

for (const target of affectTargets) {
    const targetRotation = target.document?.rotation ?? target.rotation ?? 0;

    seq.effect()
        .copySprite(target)
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .spriteRotation(-targetRotation)
        .duration(2500)
        .fadeOut(1000)
        .loopProperty("spriteContainer", "position.x", { from: -0.05, to: 0.05, duration: 25, gridUnits: true, pingPong: true })
        .tint("#ff0000")
        .opacity(0.35);

    seq.effect()
        .file(closest(`eskie.buff.one_shot.simple.${color}`))
        .attachTo(target, { offset: { y: -0.05 }, gridUnits: true })
        .scaleToObject(1.2)
        .mirrorY()
        .mirrorX()
        .filter("ColorMatrix", { brightness: 0, saturate: 1 })
        .zIndex(2);

    seq.effect()
        .file(closest(`eskie.buff.loop.simple.${color}`))
        .attachTo(target, { offset: { y: -0.05 }, gridUnits: true })
        .scaleToObject(1.2)
        .mirrorY()
        .duration(2000)
        .fadeOut(500)
        .filter("ColorMatrix", { brightness: 0, saturate: 1 })
        .zIndex(2);
}

await seq.play();
