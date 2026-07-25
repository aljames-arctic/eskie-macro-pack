// Standalone Macro: Curse of the Werewolf
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Curse of the Werewolf' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct string path if running as a standalone copy-paste macro.
 */
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

const DEFAULT_CONFIG = {
    id: "curse-of-the-werewolf",
    werewolfForm: "https://files.d20.io/images/390116904/V1XE3gOTz6-hHEg-_jQt3g/original.png",
};

const id = DEFAULT_CONFIG.id;
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id} - ${tokenId}`;
const werewolfForm = DEFAULT_CONFIG.werewolfForm;

// 2. Toggle / Re-entrant Persistent Effect Handling
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
const activeBaseEffects = Sequencer.EffectManager.getEffects({ name: id, object: token });

if ((activeEffects?.length ?? 0) > 0 || (activeBaseEffects?.length ?? 0) > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: id, object: token });
    return;
}

const tokenWidth = token.document?.width ?? 1;
const scaleX = token.document?.texture?.scaleX ?? 1;
const tokenRotation = token.document?.rotation ?? token.rotation ?? 0;

const sequence = new Sequence();

// --- PHASE 1: FULL MOON LUNAR GLOW ---
// Silvery full moon lunar radiance shining down from overhead behind the token
sequence.effect()
    .file(closest("jb2a.markers.light.complete.blue"))
    .attachTo(token, { offset: { x: 0, y: -1.2 * tokenWidth }, gridUnits: true, bindRotation: false })
    .scaleToObject(1.1 * scaleX, { considerTokenScale: true })
    .duration(5500)
    .fadeIn(800)
    .fadeOut(1200)
    .filter("ColorMatrix", { saturate: -0.4, brightness: 1.5, hue: -10 })
    .opacity(0.85)
    .belowTokens(true)
    .zIndex(0);

// Pale moonlight glow rays filtering through the darkness
sequence.effect()
    .file(closest("jb2a.moonbeam.01.intro"))
    .attachTo(token)
    .scaleToObject(1.6, { considerTokenScale: true })
    .duration(4500)
    .fadeIn(600)
    .fadeOut(1000)
    .filter("ColorMatrix", { saturate: -0.5, brightness: 1.2 })
    .opacity(0.6)
    .belowTokens(true)
    .zIndex(0.1);

// --- PHASE 2: HOWLING FOG ---
// Low dark rolling mist & howling fog creeping across the ground as the curse takes root
sequence.effect()
    .file(closest("jb2a.fog.01.dark_grey"))
    .attachTo(token)
    .scaleToObject(2.5, { considerTokenScale: true })
    .duration(6000)
    .fadeIn(1000)
    .fadeOut(1500)
    .belowTokens(true)
    .opacity(0.7)
    .randomRotation()
    .zIndex(0.2);

// --- PHASE 3: CURSED RUNIC SIGN & OUTFLOW VORTEX ---
// Red runic sign floats above the target's head
sequence.effect()
    .file(closest("jb2a.magic_signs.rune.02.complete.04.red"))
    .attachTo(token, { offset: { x: 0, y: -0.7 * tokenWidth }, gridUnits: true, bindRotation: false })
    .scaleToObject(0.5, { considerTokenScale: true })
    .duration(4000)
    .fadeOut(1000)
    .playbackRate(1.5)
    .zIndex(1);

// Small dark outflow vortex near the rune — reinforces the cursed energy
sequence.effect()
    .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
    .attachTo(token, { offset: { x: 0, y: -0.7 * tokenWidth }, gridUnits: true })
    .scaleToObject(0.5, { considerTokenScale: true })
    .duration(4000)
    .fadeIn(1000)
    .fadeOut(1000)
    .playbackRate(1.5)
    .filter("ColorMatrix", { brightness: 0 });

// Dark particle burst — curse energy erupting upward from the target
sequence.effect()
    .delay(300)
    .file(closest("jb2a.particles.outward.white.01.03"))
    .attachTo(token, { offset: { y: -0.7 }, gridUnits: true, bindRotation: false })
    .scaleToObject(0.75, { considerTokenScale: true })
    .duration(1000)
    .fadeOut(800)
    .scaleIn(0, 1000, { ease: "easeOutCubic" })
    .animateProperty("sprite", "width", { from: 0, to: 0.25, duration: 500, gridUnits: true, ease: "easeOutBack" })
    .animateProperty("sprite", "height", { from: 0, to: 1.0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
    .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.6, duration: 1000, gridUnits: true })
    .filter("ColorMatrix", { brightness: 0 })
    .opacity(0.8)
    .zIndex(0.3);

sequence.wait(400);

// Larger dark outflow beneath the token — the curse spreading outward
sequence.effect()
    .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
    .attachTo(token)
    .scaleToObject(1.4, { considerTokenScale: true })
    .duration(4000)
    .fadeIn(1000)
    .fadeOut(1000)
    .belowTokens()
    .playbackRate(1.5)
    .randomRotation()
    .filter("ColorMatrix", { brightness: 0 });

// Red inflow spiral masked to the token — the curse seeping into the target
sequence.effect()
    .file(closest("jb2a.extras.tmfx.inflow.circle.02"))
    .attachTo(token)
    .scaleToObject(1.25, { considerTokenScale: true })
    .fadeIn(250)
    .fadeOut(2500)
    .duration(4000)
    .startTime(800)
    .opacity(0.8)
    .filter("ColorMatrix", { brightness: 0.5 })
    .tint("#e82121")
    .rotate(-15)
    .mask(token);

// Ghost of the current token — glowing red, fading in as the curse takes hold
sequence.effect()
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .attachTo(token)
    .scaleToObject(1, { considerTokenScale: true })
    .fadeIn(250)
    .fadeOut(2500)
    .duration(4000)
    .belowTokens()
    .opacity(0.5)
    .filter("ColorMatrix", { brightness: 0.5 })
    .filter("Glow", { color: 0xe82121, distance: 5 });

// Subtle stretch-squash ghost of the current form — the body beginning to change
sequence.effect()
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .attachTo(token)
    .fadeIn(500)
    .fadeOut(500)
    .scaleToObject(1, { considerTokenScale: true })
    .animateProperty("sprite", "width", { from: tokenWidth * scaleX, to: (tokenWidth * 1.06) * scaleX, duration: 500, gridUnits: true, ease: "easeInOutBack" })
    .animateProperty("sprite", "height", { from: tokenWidth * scaleX, to: (tokenWidth * 1.06) * scaleX, duration: 750, gridUnits: true, ease: "easeOutBack" })
    .loopProperty("spriteContainer", "position.x", { from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true })
    .opacity(0.4);

// --- PHASE 4: WEREWOLF SHAPE TRANSFORMATION SLASH / CLAW MARKS & BEAST FORM GHOST ---
// Tearing blood-red claw marks slashing across the transforming body
sequence.effect()
    .delay(1200)
    .file(closest("jb2a.claws.200px.dark_red"))
    .attachTo(token)
    .scaleToObject(1.8, { considerTokenScale: true })
    .duration(1200)
    .fadeIn(100)
    .fadeOut(400)
    .playbackRate(1.2)
    .zIndex(3);

sequence.effect()
    .delay(1600)
    .file(closest("jb2a.claws.200px.red"))
    .attachTo(token, { offset: { x: 0.1, y: -0.1 }, gridUnits: true })
    .scaleToObject(1.6, { considerTokenScale: true })
    .duration(1000)
    .fadeIn(100)
    .fadeOut(300)
    .playbackRate(1.4)
    .zIndex(3);

// Ghost of the werewolf form — the beast surfacing through the curse
if (werewolfForm) {
    sequence.effect()
        .delay(1000)
        .file(closest(werewolfForm))
        .attachTo(token)
        .fadeIn(500)
        .fadeOut(800)
        .duration(3500)
        .scaleToObject(1, { considerTokenScale: true })
        .animateProperty("sprite", "width", { from: tokenWidth * scaleX, to: (tokenWidth * 1.08) * scaleX, duration: 500, gridUnits: true, ease: "easeInOutBack" })
        .animateProperty("sprite", "height", { from: tokenWidth * scaleX, to: (tokenWidth * 1.08) * scaleX, duration: 750, gridUnits: true, ease: "easeOutBack" })
        .loopProperty("spriteContainer", "position.x", { from: -0.005, to: 0.005, duration: 100, pingPong: true, gridUnits: true })
        .opacity(0.5)
        .filter("ColorMatrix", { saturate: 0.5 })
        .filter("Glow", { color: 0x990000, distance: 8 });
}

// --- PHASE 5: PERSISTENT FERAL BLOODLUST AURA ---
// Red pulsing primal bloodlust aura staying active on the cursed token until toggled off
sequence.effect()
    .name(label)
    .file(closest("eskie.aura.token.generic.02.red"))
    .attachTo(token)
    .scaleToObject(2.0, { considerTokenScale: true })
    .fadeIn(1000)
    .fadeOut(1000)
    .opacity(0.75)
    .filter("ColorMatrix", { saturate: 1.2, brightness: -0.1 })
    .persist();

sequence.effect()
    .name(label)
    .file(closest("jb2a.token_border.circle.static.red.012"))
    .attachTo(token)
    .scaleToObject(1.8, { considerTokenScale: true })
    .fadeIn(1000)
    .fadeOut(1000)
    .opacity(0.65)
    .belowTokens(true)
    .persist();

await sequence.play();
