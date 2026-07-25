// Standalone Macro: Petrifying Gaze
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Petrifying Gaze' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select the gaze source token!");

const targetTokens = Array.from(game.user.targets);
if (targetTokens.length === 0) {
    return ui.notifications.warn("Please target one or more tokens to gaze upon!");
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

const eyeAnimation = "jb2a.eyes.01.single.orangeyellow";
const tokenRotation = token.document?.rotation ?? token.rotation ?? 0;
const sequence = new Sequence();

sequence.effect()
    .file(closest(eyeAnimation))
    .atLocation(token)
    .size(0.9, { gridUnits: true })
    .anchor({ x: 0.5, y: 0.5 })
    .duration(6000)
    .fadeIn(200)
    .fadeOut(500);

sequence.effect()
    .file(closest(eyeAnimation))
    .atLocation(token)
    .size(0.9, { gridUnits: true })
    .anchor({ x: 0.5, y: 0.5 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .opacity(1)
    .filter("ColorMatrix", { saturate: -1, brightness: 2 })
    .duration(6000)
    .fadeIn(200)
    .fadeOut(500);

sequence.effect()
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .atLocation(token)
    .scaleToObject(1, { considerTokenScale: true })
    .filter("Blur", { blurX: 5, blurY: 20 })
    .loopProperty("spriteContainer", "position.y", { from: -10, to: 10, duration: 75, pingPong: true })
    .opacity(0.4)
    .duration(5000)
    .fadeOut(500);

sequence.effect()
    .file(closest(eyeAnimation))
    .atLocation(token)
    .belowTokens()
    .opacity(0.25)
    .size(3, { gridUnits: true })
    .duration(5000)
    .fadeIn(1000)
    .fadeOut(500);

for (const target of targetTokens) {
    const targetRotation = target.document?.rotation ?? target.rotation ?? 0;

    sequence.effect()
        .file(closest(eyeAnimation))
        .atLocation(token)
        .scale({ x: 0.1, y: 1.25 })
        .anchor({ x: 0.5, y: 0.35 })
        .opacity(0.5)
        .rotate(90)
        .rotateTowards(target)
        .belowTokens()
        .duration(5000)
        .fadeIn(500)
        .fadeOut(500);

    sequence.effect()
        .file(closest("jb2a.eyes.01.single.orangered"))
        .atLocation(token)
        .scale({ x: 0.1, y: 1.25 })
        .anchor({ x: 0.5, y: 0.35 })
        .opacity(0.2)
        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
        .rotate(90)
        .rotateTowards(target)
        .duration(5000)
        .fadeIn(500)
        .fadeOut(500);

    sequence.effect()
        .file(closest("jb2a.wind_stream.white"))
        .atLocation(token)
        .stretchTo(target, { onlyX: false })
        .filter("Blur", { blurX: 10, blurY: 20 })
        .loopProperty("spriteContainer", "position.y", { from: -10, to: 10, duration: 100, pingPong: true })
        .opacity(0.3);

    sequence.effect()
        .copySprite(target)
        .spriteRotation(-targetRotation)
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .filter("Blur", { blurX: 5, blurY: 20 })
        .loopProperty("spriteContainer", "position.y", { from: -10, to: 10, duration: 100, pingPong: true })
        .opacity(0.8)
        .duration(5000)
        .fadeIn(1000)
        .fadeOut(500);
}

await sequence.play();
