// Standalone Macro: Totemic Attunement - Eagle
// Last Updated: 1/27/2025
// Author: .eskie
// Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Eagle Totemic Attunement' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select your Barbarian token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const id = "Eagle Totemic Attunement";
const color = "red";
const wingSize = 1.25;
const flaps = 2;
const sway = 1;
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id} - ${tokenId}`;

// Toggle off if persistent eagle flight is active
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
if (activeEffects.length > 0) {
    await new Sequence().animation().on(token).opacity(1).play();
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    return ui.notifications.info("Ended Eagle flight spirit aura.");
}

const tokenRotation = token.document?.rotation ?? token.rotation ?? 0;
let seq = new Sequence();

seq.animation()
    .delay(100)
    .on(token)
    .opacity(0);

seq.effect()
    .name(label)
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .attachTo(token, { bindAlpha: false })
    .scaleToObject(0.8, { considerTokenScale: true })
    .zIndex(0.1)
    .persist()
    .belowTokens()
    .filter("ColorMatrix", { brightness: 0 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .opacity(0.65);

seq.effect()
    .delay(400)
    .file(closest("eskie.sound.roar.01"))
    .attachTo(token, { offset: { y: -0.5 - 0.1 * sway }, gridUnits: true, bindAlpha: false })
    .scaleToObject(3.5)
    .opacity(0.75)
    .randomRotation();

if (flaps !== 0) {
    let wing1 = seq.effect()
        .name(label)
        .file(closest("eskie.wings.bird.01"))
        .attachTo(token, { offset: { y: -0.5 - 0.1 * sway }, gridUnits: true, bindAlpha: false })
        .scaleToObject(3 * wingSize)
        .animateProperty("spriteContainer", "position.y", { from: 0.5 + 0.1 * sway, to: 0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
        .loopProperty("spriteContainer", "position.y", { values: [0.075 * sway, 0.1 * sway, 0.025 * sway, 0, 0.025 * sway, 0.05 * sway], duration: 1000, gridUnits: true, ease: "linear", pingPong: true })
        .playbackRate(2);
    if (flaps > 0) wing1.loopOptions({ loops: flaps, loopDelay: 1000, endOnLastLoop: true });
    wing1.fadeIn(500, { ease: "easeOutCubic", delay: 350 })
        .fadeOut(500, { ease: "easeOutCubic" })
        .tint("#ff0000")
        .filter("ColorMatrix", { brightness: 5, saturate: -1 })
        .opacity(0.25)
        .zIndex(0)
        .persist();

    let wing2 = seq.effect()
        .name(label)
        .file(closest("eskie.wings.bird.01"))
        .attachTo(token, { offset: { y: -0.5 - 0.1 * sway }, gridUnits: true, bindAlpha: false })
        .scaleToObject(3 * wingSize)
        .animateProperty("spriteContainer", "position.y", { from: 0.5 + 0.1 * sway, to: 0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
        .loopProperty("spriteContainer", "position.y", { values: [0.075 * sway, 0.1 * sway, 0.025 * sway, 0, 0.025 * sway, 0.05 * sway], duration: 1000, gridUnits: true, ease: "linear", pingPong: true })
        .playbackRate(2);
    if (flaps > 0) wing2.loopOptions({ loops: flaps, loopDelay: 1000, endOnLastLoop: true });
    wing2.fadeIn(500, { ease: "easeOutCubic", delay: 350 })
        .fadeOut(500, { ease: "easeOutCubic" })
        .tint("#ff0000")
        .filter("ColorMatrix", { brightness: 3, saturate: 1, hue: 20 })
        .opacity(1)
        .filter("Glow", { color: 0xFF0000, knockout: true, distance: 5 })
        .zIndex(0)
        .persist();
}

seq.effect()
    .name(label)
    .file(closest(`eskie.buff.loop.simple.${color}`))
    .attachTo(token, { offset: { y: -0.5 - 0.1 * sway }, gridUnits: true, bindAlpha: false })
    .animateProperty("spriteContainer", "position.y", { from: 0.5 + 0.1 * sway, to: 0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
    .loopProperty("spriteContainer", "position.y", { values: [0.075 * sway, 0.1 * sway, 0.025 * sway, 0, 0.025 * sway, 0.05 * sway], duration: 1000, gridUnits: true, ease: "linear", pingPong: true })
    .scaleToObject(1)
    .opacity(0.5)
    .filter("ColorMatrix", { saturate: 1 })
    .playbackRate(1)
    .fadeOut(500)
    .zIndex(0.2)
    .persist();

seq.effect()
    .name(label)
    .file(closest(`eskie.aura.token.generic.02.${color}`))
    .attachTo(token, { offset: { y: -0.5 - 0.1 * sway }, gridUnits: true, bindAlpha: false })
    .animateProperty("spriteContainer", "position.y", { from: 0.5 + 0.1 * sway, to: 0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
    .loopProperty("spriteContainer", "position.y", { values: [0.075 * sway, 0.1 * sway, 0.025 * sway, 0, 0.025 * sway, 0.05 * sway], duration: 1000, gridUnits: true, ease: "linear", pingPong: true })
    .scaleToObject(2.1)
    .zIndex(0.2)
    .timeRange(500, 2500)
    .persist();

seq.effect()
    .name(label)
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .attachTo(token, { offset: { y: -0.5 - 0.1 * sway }, gridUnits: true, bindAlpha: false })
    .scaleToObject(1, { considerTokenScale: true })
    .zIndex(0.1)
    .persist()
    .animateProperty("spriteContainer", "position.y", { from: 0.5 + 0.1 * sway, to: 0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
    .loopProperty("spriteContainer", "position.y", { values: [0.075 * sway, 0.1 * sway, 0.025 * sway, 0, 0.025 * sway, 0.05 * sway], duration: 1000, gridUnits: true, ease: "linear", pingPong: true });

await seq.play();
