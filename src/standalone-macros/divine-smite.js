// Standalone Macro: Divine Smite
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Divine Smite' macro requires the 'Sequencer' module to be installed and active!");
}

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to the default path if running as a standalone copy-paste macro.
 */
const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

// Casting token validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// Target token validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please target a token!");
}

const id = "divineSmite";
const color = "yellowwhite";
const label = `${id}-${token.id}`;

// Check if an effect sequence with this label is already playing (re-entrant / toggle support)
const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0
    || Sequencer.EffectManager.getEffects({ name: label }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label });
    return;
}

const tokenWidth = token.document?.width ?? 1;

let seq = new Sequence();

// 1. Radiant particles outward flash on caster token
seq = seq.effect()
    .name(label)
    .delay(500)
    .file(closest("jb2a.particles.outward.white.02.03"))
    .attachTo(token, { offset: { y: -0.25 }, gridUnits: true, bindRotation: false })
    .scaleToObject(1.2)
    .playbackRate(2)
    .duration(2000)
    .fadeOut(800)
    .fadeIn(1000)
    .animateProperty("sprite", "height", { from: 0, to: 2, duration: 3000, gridUnits: true, ease: "easeOutBack" })
    .filter("Blur", { blurX: 0, blurY: 15 })
    .opacity(2)
    .zIndex(0.2);

// 2. Divine smite caster reversed on token
seq = seq.effect()
    .name(label)
    .delay(1050)
    .file(closest(`jb2a.divine_smite.caster.reversed.${color}`))
    .atLocation(token)
    .scaleToObject(2.2)
    .startTime(900)
    .fadeIn(200);

// 3. Divine smite caster aura on token
seq = seq.effect()
    .name(label)
    .file(closest(`jb2a.divine_smite.caster.${color}`))
    .atLocation(token)
    .scaleToObject(1.85)
    .belowTokens()
    .waitUntilFinished(-1200);

// 4. Dynamic camera pan / screen shake
seq = seq.canvasPan()
    .delay(300)
    .shake({ duration: 1000, strength: 1, rotation: false, fadeOutDuration: 1000 });

// 5 & 6. Ground crack impact & divine smite radiant target attack ray on targeted tokens
for (const target of targets) {
    seq = seq.effect()
        .name(label)
        .delay(300)
        .file(closest("jb2a.impact.ground_crack.01.blue"))
        .atLocation(target)
        .size(2.3 * tokenWidth, { gridUnits: true })
        .filter("ColorMatrix", { saturate: -0.5, hue: -160 })
        .belowTokens()
        .playbackRate(0.85)
        .randomRotation();

    seq = seq.effect()
        .name(label)
        .file(closest(`jb2a.divine_smite.target.${color}`))
        .atLocation(target)
        .rotateTowards(token)
        .scaleToObject(3)
        .spriteOffset({ x: -1.5 * tokenWidth, y: 0 }, { gridUnits: true })
        .mirrorY()
        .rotate(90)
        .zIndex(2);
}

await seq.play();
