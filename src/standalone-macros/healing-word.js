// Standalone Macro: Healing Word
// Original Author: EskieMoh#2969
// Update Author: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Healing Word' macro requires the 'Sequencer' module to be installed and active!");
}

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to the default path if running as a standalone copy-paste macro.
 */
const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

// Casting token validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// Target token validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please select a target!");
}

const label = `HealingWord-${token.id}`;

// Check if an effect sequence with this label is already playing
const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0 
    || Sequencer.EffectManager.getEffects({ name: label }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label });
    return;
}

// Configuration options with nullish coalescing fallbacks
const config = {
    color: "green",
    word: "Heal!",
};
const color = config.color ?? "green";
const word = config.word ?? "Heal!";

function getColor(c) {
    if (!c) return { hue: -35, hex: "#00FF00" };
    switch (c.toLowerCase()) {
        case "red": return { hue: 0, hex: "#FF0000" };
        case "yellow": return { hue: 0, hex: "#FFFF00" };
        case "green": return { hue: -35, hex: "#00FF00" };
        case "blue": return { hue: 0, hex: "#0000FF" };
        case "purple": return { hue: -35, hex: "#FF00FF" };
        default: return { hue: null, hex: c };
    }
}

const colorVal = getColor(color);
const tokenWidth = token.document.width ?? 1;

const seq = new Sequence();

const style = {
    fill: "#ffffff",
    fontFamily: "Helvetica",
    fontSize: 24 * tokenWidth,
    strokeThickness: 0,
    fontWeight: "bold",
};

for (let target of targets) {
    const targetWidth = target.document.width ?? 1;
    const target_seq = new Sequence()
        .effect()
        .name(label)
        .atLocation(target, { offset: { x: 0, y: -0.55 * targetWidth }, gridUnits: true })
        .file(closest(`eskie.pulse.energy.02.fast.${color}`))
        .fadeOut(250)
        .zIndex(1)
        .scale(0.25 * targetWidth)
        .scaleIn(0, 500, { ease: "easeOutBack" })
        .zIndex(0)

        .effect()
        .name(label)
        .atLocation(target, { offset: { x: 0, y: -0.55 * targetWidth }, gridUnits: true })
        .file(closest("jb2a.particles.outward.orange.02.04"))
        .fadeOut(250)
        .zIndex(1)
        .scale(0.25 * targetWidth)
        .duration(600)
        .scaleIn(0, 500, { ease: "easeOutBack" })
        .zIndex(0)

        .effect()
        .name(label)
        .atLocation(target, { offset: { x: 0, y: -0.6 * targetWidth }, gridUnits: true })
        .file(closest("jb2a.particles.outward.orange.02.03"))
        .fadeOut(250)
        .zIndex(1)
        .scale(0.25 * targetWidth)
        .scaleIn(0, 500, { ease: "easeOutBack" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: 0.6 * targetWidth, duration: 1000, gridUnits: true, delay: 500 })
        .animateProperty("spriteContainer", "scale.x", { from: 0, to: 0.15, duration: 1000, delay: 500 })
        .animateProperty("spriteContainer", "scale.y", { from: 0, to: 0.15, duration: 1000, delay: 500 })
        .zIndex(1.1)

        .effect()
        .name(label)
        .atLocation(target, { offset: { x: 0, y: -0.6 * targetWidth }, gridUnits: true })
        .text(word, style)
        .duration(2000)
        .fadeOut(1000)
        .zIndex(1)
        .animateProperty("spriteContainer", "position.y", { from: 0, to: 0.6 * targetWidth, duration: 2000, gridUnits: true })
        .rotateIn(-10, 1000, { ease: "easeOutElastic" })
        .scaleIn(0, 500, { ease: "easeOutElastic" })
        .filter("Glow", { color: colorVal.hex })
        .zIndex(1);

    seq.addSequence(target_seq);
}

seq.effect()
    .name(label)
    .atLocation(token, { offset: { x: 0, y: -0.6 * tokenWidth }, gridUnits: true })
    .text(word, style)
    .duration(2000)
    .fadeOut(250)
    .zIndex(1)
    .animateProperty("spriteContainer", "scale.x", { from: 0, to: 0.5, duration: 1000, delay: 500 })
    .animateProperty("spriteContainer", "scale.y", { from: 0, to: 0.5, duration: 1000, delay: 500 })
    .filter("ColorMatrix", { brightness: 0 })
    .opacity(0.75)
    .scaleIn(0, 500, { ease: "easeOutBack" })
    .waitUntilFinished(-750);

for (let target of targets) {
    const targetRotation = target.document.rotation ?? 0;
    const target_seq = new Sequence()
        .effect()
        .name(label)
        .atLocation(target)
        .file(closest(`jb2a.healing_generic.200px.${color}`))
        .scaleToObject(1.25)
        .filter("ColorMatrix", { hue: colorVal.hue })
        .zIndex(2)

        .effect()
        .name(label)
        .copySprite(target)
        .spriteRotation(-targetRotation)
        .opacity(0.5)
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .filter("Glow", { color: colorVal.hex, distance: 20 })
        .duration(1000)
        .fadeIn(500)
        .fadeOut(500, { ease: "easeInSine" })
        .filter("ColorMatrix", { brightness: 1.5 })
        .tint(colorVal.hex);

    seq.addSequence(target_seq);
}

await seq.play();
