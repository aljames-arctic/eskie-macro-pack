// Standalone Macro: Frightful Moan
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Frightful Moan' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please select at least one target!");
}

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct string path if running as a standalone copy-paste macro.
 */
const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const id = "frightfulMoan";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id}-${tokenId}`;

// 3. Toggle / Re-entrant Persistent Effect Handling
const isTargetActive = (target) => {
    const targetId = target?.id ?? target?.document?.id ?? "";
    const targetLabel = `${id}-${targetId}`;
    return Sequencer.EffectManager.getEffects({ name: targetLabel, object: target }).length > 0 ||
           Sequencer.EffectManager.getEffects({ name: targetLabel }).length > 0 ||
           Sequencer.EffectManager.getEffects({ name: id, object: target }).length > 0;
};

const stopTargetEffect = (target) => {
    const targetId = target?.id ?? target?.document?.id ?? "";
    const targetLabel = `${id}-${targetId}`;
    Sequencer.EffectManager.endEffects({ name: targetLabel, object: target });
    Sequencer.EffectManager.endEffects({ name: targetLabel });
    Sequencer.EffectManager.endEffects({ name: id, object: target });
};

const casterActive = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0 ||
                     Sequencer.EffectManager.getEffects({ name: label }).length > 0 ||
                     Sequencer.EffectManager.getEffects({ name: id, object: token }).length > 0;

const anyTargetActive = targets.some(target => isTargetActive(target));

if (casterActive || anyTargetActive) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label });
    Sequencer.EffectManager.endEffects({ name: id, object: token });
    targets.forEach(target => stopTargetEffect(target));
    return;
}

const sequence = new Sequence();

// -------------------------------------------------------------
// CASTER SEQUENCE: GHOST BANSHEE WAIL SPECTRAL WAVE PULSE
// -------------------------------------------------------------

// Inward gathering aura on caster token
sequence.effect()
    .name(label)
    .file(closest("jb2a.extras.tmfx.inpulse.circle.01.normal"))
    .attachTo(token, { bindAlpha: false })
    .scaleToObject(1.75)
    .randomRotation()
    .fadeIn(1000, { delay: 0 })
    .opacity(1)
    .aboveLighting()
    .persist();

// Inward white particles converging on caster token
sequence.effect()
    .name(label)
    .file(closest("jb2a.particles.inward.white.01.02"))
    .atLocation(token)
    .scaleToObject(2)
    .duration(500)
    .randomRotation()
    .fadeOut(400)
    .scaleOut(0, 750, { ease: "easeOutCubic" })
    .repeats(4, 150, 150)
    .opacity(0.5)
    .aboveLighting()
    .zIndex(1)
    .waitUntilFinished(500);

// Desaturated blue impact shockwave vibrating and expanding from caster
sequence.effect()
    .name(label)
    .file(closest("jb2a.impact.004.blue"))
    .atLocation(token)
    .scaleToObject(6)
    .randomRotation()
    .fadeIn(700)
    .fadeOut(1000)
    .scaleIn(0, 3000, { ease: "easeOutExpo" })
    .repeats(8, 450, 450)
    .opacity(0.4)
    .filter("ColorMatrix", { saturate: -1, brightness: 1.1 })
    .aboveLighting()
    .loopProperty("spriteContainer", "position.x", { from: 0.01, to: -0.01, gridUnits: true, pingPong: true, duration: 50 })
    .zIndex(1)
    .persist();

// Spectral wave pulse radiating outward from caster
sequence.effect()
    .name(label)
    .file(closest("jb2a.extras.tmfx.outpulse.circle.01.fast"))
    .attachTo(token, { bindAlpha: false })
    .size(13, { gridUnits: true })
    .repeats(8, 450, 450)
    .opacity(0.25)
    .filter("ColorMatrix", { saturate: -1 })
    .loopProperty("spriteContainer", "position.x", { from: 0.01, to: -0.01, gridUnits: true, pingPong: true, duration: 50 })
    .aboveLighting()
    .zIndex(0)
    .persist();

// Camera shake for banshee scream impact
sequence.canvasPan()
    .delay(100)
    .shake({ duration: 3600, strength: 2, rotation: false, fadeOut: 1000 });

// -------------------------------------------------------------
// TARGET SEQUENCE: RADIATING OUTWARD WAVE, SHAKE & FEAR ICONS
// -------------------------------------------------------------
for (const target of targets) {
    const targetId = target?.id ?? target?.document?.id ?? "";
    const targetLabel = `${id}-${targetId}`;
    const targetWidth = target.document?.width ?? target.width ?? 1;
    const targetRotation = target.document?.rotation ?? target.rotation ?? 0;

    // Radiating spectral wail energy wave traveling from caster to target
    sequence.effect()
        .name(targetLabel)
        .delay(300)
        .file(closest("jb2a.impact.004.blue"))
        .atLocation(token)
        .stretchTo(target, { attachTo: true })
        .scaleToObject(1.5)
        .filter("ColorMatrix", { saturate: -1, brightness: 1.3 })
        .opacity(0.5)
        .fadeIn(200)
        .fadeOut(400)
        .duration(800)
        .zIndex(1.5);

    // Outpulse blast ring hitting target as wave arrives
    sequence.effect()
        .name(targetLabel)
        .delay(500)
        .file(closest("jb2a.extras.tmfx.outpulse.circle.01.fast"))
        .atLocation(target)
        .scaleToObject(2.5)
        .filter("ColorMatrix", { saturate: -1, brightness: 1.2 })
        .opacity(0.4)
        .fadeIn(100)
        .fadeOut(500)
        .duration(1000)
        .zIndex(1);

    // Trembling / shaking frightened target token animation
    sequence.effect()
        .name(targetLabel)
        .delay(500)
        .copySprite(target)
        .spriteRotation(-targetRotation)
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .fadeIn(200)
        .fadeOut(500)
        .loopProperty("spriteContainer", "position.x", { from: -0.08, to: 0.08, duration: 40, pingPong: true, gridUnits: true })
        .duration(3600)
        .opacity(0.35)
        .tint(0xaaddee)
        .filter("ColorMatrix", { saturate: -1, brightness: 1.4 })
        .persist();

    // Floating Fear Icons (Screaming face & skull emoji indicators) above target
    sequence.effect()
        .name(targetLabel)
        .delay(550)
        .atLocation(target, { offset: { y: -0.8 * targetWidth }, gridUnits: true })
        .text("😱 💀 😱", {
            fill: "#90e0ef",
            fontFamily: "Segoe UI Emoji, Apple Color Emoji, sans-serif",
            fontSize: 32 * targetWidth,
            stroke: "#000000",
            strokeThickness: 4
        })
        .duration(3600)
        .fadeIn(250)
        .fadeOut(600)
        .scaleIn(0, 400, { ease: "easeOutBack" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.4, duration: 3000, gridUnits: true, ease: "easeOutCubic" })
        .loopProperty("spriteContainer", "position.x", { from: -0.04, to: 0.04, duration: 120, pingPong: true, gridUnits: true })
        .zIndex(3)
        .persist();

    // Spectral terror skull overlay pulsing above target
    sequence.effect()
        .name(targetLabel)
        .delay(650)
        .file(closest("jb2a.toll_the_dead.red.skull_smoke"))
        .atLocation(target, { offset: { y: -0.2 * targetWidth }, gridUnits: true })
        .scaleToObject(1.1)
        .filter("ColorMatrix", { saturate: -1, brightness: 1.4 })
        .fadeIn(300)
        .fadeOut(600)
        .duration(3600)
        .loopProperty("spriteContainer", "position.y", { from: -0.08, to: 0.08, duration: 600, pingPong: true, gridUnits: true })
        .zIndex(2.5)
        .persist();
}

await sequence.play();
