// Standalone Macro: True Strike
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'True Strike' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const targets = Array.from(game.user.targets);
const id = "true-strike";
const activeTrueStrike = Sequencer.EffectManager.getEffects({ name: "*TrueStrike*" }).concat(
    Sequencer.EffectManager.getEffects({ name: "*true-strike*" })
);
if (activeTrueStrike.length > 0) {
    if (typeof Tagger !== "undefined") {
        Tagger.removeTags(token, "TrueStrike");
    }
    Sequencer.EffectManager.endEffects({ name: "*TrueStrike*" });
    Sequencer.EffectManager.endEffects({ name: "*true-strike*" });
    Sequencer.EffectManager.endEffects({ name: id });
    return ui.notifications.info("Ended True Strike aim lock.");
}

if (targets.length === 0) {
    return ui.notifications.warn("Please target at least one token!");
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

const allTokens = [token, ...targets];

if (typeof Tagger !== "undefined") {
    Tagger.addTags(token, "TrueStrike");
}

const sequence = new Sequence();
const casterLabel = `${id}-${token.id ?? token.document?.id ?? ""}`;

// ============================================================================
// CASTER DIVINATION FORESIGHT & GLOWING EYE OVERLAY
// ============================================================================

// 1. Star ward pulse
sequence.effect()
    .name(casterLabel)
    .file(closest("jb2a.ward.star.yellow.02"))
    .atLocation(token)
    .scale(0.25)
    .duration(3000)
    .fadeIn(1000)
    .fadeOut(500);

// 2. High-brightness star desaturated burst
sequence.effect()
    .name(casterLabel)
    .file(closest("jb2a.ward.star.yellow.02"))
    .atLocation(token)
    .scale(0.25)
    .fadeIn(500)
    .fadeOut(500)
    .filter("ColorMatrix", { saturate: -1, brightness: 1.5 })
    .duration(1000);

// 3. Outward golden/orange insight particles
sequence.effect()
    .name(casterLabel)
    .file(closest("jb2a.particles.outward.orange.01.03"))
    .scaleIn(0.25, 500, { ease: "easeOutQuint" })
    .size(2, { gridUnits: true })
    .fadeIn(500)
    .atLocation(token)
    .duration(3500)
    .fadeOut(2500);

// 4. Border circle outpulse ring
sequence.effect()
    .name(casterLabel)
    .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
    .atLocation(token)
    .size(1.5, { gridUnits: true });

// 5. Persistent blue glint aura on caster
sequence.effect()
    .name(casterLabel)
    .file(closest("jb2a.glint.blue.few"))
    .atLocation(token)
    .scaleToObject(1.75)
    .attachTo(token)
    .persist();

// 6. Spinning blue token border transient spin
sequence.effect()
    .name(casterLabel)
    .file(closest("jb2a.token_border.circle.spinning.blue.001"))
    .atLocation(token)
    .attachTo(token)
    .fadeIn(200)
    .fadeOut(500)
    .duration(750)
    .filter("ColorMatrix", { saturate: -1, brightness: 1.5 })
    .zIndex(1)
    .scaleToObject(2);

// 7. Persistent spinning orange token border
sequence.effect()
    .name(casterLabel)
    .file(closest("jb2a.token_border.circle.spinning.orange.001"))
    .atLocation(token)
    .attachTo(token)
    .fadeIn(700)
    .scaleToObject(2)
    .playbackRate(5)
    .filter("ColorMatrix", { hue: 30, saturate: 1, contrast: 0, brightness: 1 })
    .scaleOut(0, 250)
    .opacity(0.9)
    .persist();

// 8. Glowing Foresight Eye Overlay hovering above caster
sequence.effect()
    .name(casterLabel)
    .file(closest("eskie.symbol.eye.01.cyan"))
    .atLocation(token)
    .attachTo(token, { offset: { y: -0.65 }, gridUnits: true })
    .scaleToObject(0.55)
    .scaleIn(0, 400, { ease: "easeOutBack" })
    .fadeIn(300)
    .filter("ColorMatrix", { hue: 190, saturate: 1.5, brightness: 1.3 })
    .filter("Glow", { color: 0x00d2ff, distance: 10 })
    .loopProperty("spriteContainer", "position.y", { from: -0.05, to: 0.05, duration: 1200, pingPong: true, gridUnits: true })
    .persist()
    .zIndex(3);

// ============================================================================
// TARGET DIVINATION ANALYTICAL TARGET CROSSHAIR RETICLE SCANNING MARK
// ============================================================================

for (const target of targets) {
    const targetLabel = `${id}-${target.id ?? target.document?.id ?? ""}`;
    const targetScaleX = target.document?.texture?.scaleX ?? 1;

    // 1. Divination analytical circle intro mark on target
    sequence.effect()
        .name(targetLabel)
        .file(closest("jb2a.magic_signs.circle.02.divination.intro.blue"))
        .atLocation(target)
        .attachTo(target)
        .scaleToObject(1.6 * targetScaleX)
        .rotateIn(-180, 500, { ease: "easeOutCubic" })
        .fadeIn(300)
        .duration(1200)
        .filter("ColorMatrix", { hue: 180, saturate: 1.2, brightness: 1.2 })
        .belowTokens();

    // 2. Persistent Divination loop analytical scanning mark below target
    sequence.effect()
        .name(targetLabel)
        .file(closest("jb2a.magic_signs.circle.02.divination.loop.blue"))
        .atLocation(target)
        .attachTo(target)
        .scaleToObject(1.5 * targetScaleX)
        .delay(400)
        .fadeIn(500)
        .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 12000 })
        .filter("ColorMatrix", { hue: 180, saturate: 1.3, brightness: 1.1 })
        .belowTokens()
        .opacity(0.85)
        .persist();

    // 3. Spinning blue analytical crosshair reticle target tracking ring
    sequence.effect()
        .name(targetLabel)
        .file(closest("jb2a.token_border.circle.spinning.blue.001"))
        .atLocation(target)
        .attachTo(target)
        .scaleToObject(1.3 * targetScaleX)
        .delay(500)
        .fadeIn(400)
        .playbackRate(1.5)
        .filter("ColorMatrix", { hue: 190, saturate: 1.5, brightness: 1.5 })
        .loopProperty("sprite", "rotation", { from: 360, to: 0, duration: 6000 })
        .opacity(0.95)
        .persist()
        .zIndex(2);

    // 4. Analytical scan pulse expanding over weakness point
    sequence.effect()
        .name(targetLabel)
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .atLocation(target)
        .attachTo(target)
        .scaleToObject(1.4 * targetScaleX)
        .delay(600)
        .fadeIn(200)
        .fadeOut(400)
        .duration(1500)
        .filter("ColorMatrix", { hue: 180, saturate: 2 });
}

// ============================================================================
// TRUE STRIKE ANALYTICAL PRECISION ATTACK STRIKE SEQUENCE
// ============================================================================

for (const target of targets) {
    const targetLabel = `${id}-${target.id ?? target.document?.id ?? ""}`;

    // Charge burst at caster
    sequence.effect()
        .name(targetLabel)
        .file(closest("jb2a.impact.002.yellow"))
        .atLocation(token)
        .scaleToObject(2)
        .delay(1250);

    sequence.wait(1000);

    // Analytical trajectory guidance wind stream pointing towards target
    sequence.effect()
        .name(targetLabel)
        .file(closest("jb2a.wind_stream.white"))
        .atLocation(token)
        .rotateTowards(target)
        .rotate(-180)
        .anchor({ x: 0.5 })
        .size(1, { gridUnits: true })
        .opacity(1)
        .duration(1500)
        .loopProperty('spriteContainer', 'position.x', { from: -5, to: 5, duration: 50, pingPong: true })
        .fadeOut(3000)
        .zIndex(1);

    // Three staggered outpulse precision vectors projecting from caster to target
    sequence.effect()
        .name(targetLabel)
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .atLocation(token)
        .anchor({ x: 0.25 })
        .rotateTowards(target)
        .animateProperty('spriteContainer', "scale.y", { from: 0.5, to: 1, duration: 50, pingPong: false })
        .animateProperty('spriteContainer', 'position.x', { from: 0, to: -500, duration: 5000 })
        .scaleToObject();

    sequence.effect()
        .name(targetLabel)
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .atLocation(token)
        .rotateTowards(target)
        .anchor({ x: -0.25 })
        .scaleToObject(0.75)
        .animateProperty('spriteContainer', "scale.y", { from: 0.25, to: 0.75, duration: 50, pingPong: false })
        .animateProperty('spriteContainer', 'position.x', { from: 0, to: -500, duration: 5000 })
        .delay(25);

    sequence.effect()
        .name(targetLabel)
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .atLocation(token)
        .anchor({ x: -1.25 })
        .rotateTowards(target)
        .animateProperty('spriteContainer', "scale.y", { from: 0.25, to: 0.5, duration: 50, pingPong: false })
        .animateProperty('spriteContainer', 'position.x', { from: 0, to: -500, duration: 5000 })
        .scaleToObject(0.5)
        .delay(40);

    // Precision weak-point guided red arrow strike
    sequence.effect()
        .name(targetLabel)
        .file(closest("eskie.attack.ranged.arrow.01.physical.heavy.red.normal"))
        .atLocation(target)
        .anchor({ x: 0.75 })
        .scale(0.075)
        .rotateTowards(token)
        .delay(10)
        .rotate(180)
        .zIndex(2);

    // Precision ground crack impact at target
    sequence.effect()
        .name(targetLabel)
        .file(closest("jb2a.impact.ground_crack.orange.02"))
        .atLocation(target)
        .filter("ColorMatrix", { hue: 20, saturate: 1 })
        .scaleToObject(0.7)
        .fadeOut(5000)
        .delay(10)
        .zIndex(1);

    // Gold energy impact flash on target
    sequence.effect()
        .name(targetLabel)
        .file(closest("jb2a.impact.002.yellow"))
        .atLocation(target)
        .scaleToObject(3)
        .delay(0)
        .zIndex(2)
        .waitUntilFinished(-2000);

    // Persistent ground fractures on target
    sequence.effect()
        .name(targetLabel)
        .file(closest("jb2a.impact.ground_crack.orange.02"))
        .atLocation(target)
        .filter("ColorMatrix", { hue: 20, saturate: 1 })
        .scaleToObject(0.7)
        .delay(10)
        .fadeOut(1000)
        .duration(4000)
        .zIndex(0);

    // Strategic feedback particle stream towards caster
    sequence.effect()
        .name(targetLabel)
        .file(closest("jb2a.particles.outward.orange.01.03"))
        .scaleIn(0.25, 500, { ease: "easeOutQuint" })
        .fadeIn(250)
        .rotateTowards(token)
        .fadeOut(500)
        .scaleToObject(1.5)
        .atLocation(target)
        .animateProperty('spriteContainer', 'position.x', { from: -250, to: -1000, duration: 5000 })
        .duration(2000)
        .delay(0);

    // Analytical verification glints on targeted creature
    sequence.effect()
        .name(targetLabel)
        .file(closest("jb2a.glint.blue.many"))
        .atLocation(target)
        .randomRotation()
        .scaleToObject(0.75)
        .attachTo(target)
        .fadeIn(1000)
        .fadeOut(1000);
}

await sequence.play();
