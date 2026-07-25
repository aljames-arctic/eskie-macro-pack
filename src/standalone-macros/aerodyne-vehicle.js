// Standalone Macro: Aerodyne Vehicle / Hover Jet Thrusters
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Aerodyne Vehicle' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a vehicle or hover token!");

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

const id = "AerodyneVehicle";
const effectName = "Fly";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id}-${tokenId}`;

// Toggle hover flight state
const activeEffects = Sequencer.EffectManager.getEffects({ name: effectName, object: token }) ?? [];
if (activeEffects.length > 0) {
    if (typeof Tagger !== "undefined") {
        await Tagger.removeTags(token, "Flying");
    }
    await Sequencer.EffectManager.endEffects({ name: effectName, object: token });
    await Sequencer.EffectManager.endEffects({ name: effectName });
    await new Sequence()
        .animation()
        .on(token)
        .opacity(1)
        .effect()
        .file(closest("eskie.smoke.07.white"))
        .atLocation(token)
        .randomRotation()
        .scale(1.2)
        .belowTokens()
        .opacity(0.25)
        .loopProperty("sprite", "scale.x", { from: 1, to: 1.5, duration: 900 })
        .loopProperty("sprite", "scale.y", { from: 1, to: 1.5, duration: 900 })
        .belowTokens()
        .play();
    return ui.notifications.info(`Landed ${token.name}.`);
}

const tokenRotation = token.document?.rotation ?? token.rotation ?? 0;
const w = token.w ?? token.document?.width ?? 1;
const h = token.h ?? token.document?.height ?? 1;

const seq = new Sequence()
    .effect()
    .file(closest("eskie.smoke.07.white"))
    .atLocation(token)
    .randomRotation()
    .scale(1.2)
    .opacity(0.25)
    .loopProperty("sprite", "scale.x", { from: 1, to: 1.5, duration: 900 })
    .loopProperty("sprite", "scale.y", { from: 1, to: 1.5, duration: 900 })
    .belowTokens()

    .animation()
    .on(token)
    .opacity(0)

    .effect()
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .name(effectName)
    .atLocation(token, { offset: { x: 0, y: -0.2 }, gridUnits: true })
    .size({ width: w, height: h })
    .opacity(1)
    .animateProperty("spriteContainer", "position.y", { from: 20, to: 0, duration: 500 })
    .loopProperty("spriteContainer", "position.y", { from: 0, to: -20, duration: 2500, pingPong: true, delay: 500 })
    .attachTo(token, { gridUnits: true, bindRotation: true, bindAlpha: false })
    .animateProperty("sprite", "rotation", { from: 0, to: 0, duration: 0 })
    .aboveLighting()
    .zIndex(2)
    .persist()

    .effect()
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .name(effectName)
    .atLocation(token)
    .size({ width: w, height: h })
    .duration(1000)
    .opacity(0.5)
    .filter("ColorMatrix", { brightness: -1 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .attachTo(token, { offset: { x: 0, y: 0.25 }, gridUnits: true, bindRotation: true, bindAlpha: false })
    .animateProperty("sprite", "rotation", { from: 0, to: 0, duration: 0 })
    .zIndex(0)
    .persist();

const thrusterOffsets = [
    { x: 1.2, y: 1.2 },
    { x: -1.2, y: 1.2 },
    { x: 1.2, y: -1.2 },
    { x: -1.2, y: -1.2 }
];

for (const offset of thrusterOffsets) {
    seq.effect()
        .file(closest("jb2a.dancing_lights.01.blueteal"))
        .scaleToObject(0.25)
        .name(effectName)
        .atLocation(token, { offset, gridUnits: true, local: true })
        .attachTo(token, { bindAlpha: false })
        .filter("ColorMatrix", { saturate: 1 })
        .filter("Blur", { blurX: 10, blurY: 10 })
        .persist()
        .playbackRate(5)
        .loopProperty("spriteContainer", "position.y", { from: 0, to: -20, duration: 2500, pingPong: true, delay: 500 })
        .spriteRotation(tokenRotation)
        .zIndex(0);
}

await seq.play();
