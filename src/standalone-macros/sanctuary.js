// Standalone Macro: Sanctuary
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Sanctuary' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please select a target!");
}

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct string path if running as a standalone copy-paste macro.
 */
const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const id = "Sanctuary";

// 3. Toggle / Re-entrant Persistent Effect Handling
let isPlaying = false;
for (const target of targets) {
    const label = `${target.name ?? "Target"} ${id}`;
    const activeFx = Sequencer.EffectManager.getEffects({ name: label, object: target });
    const fallbackFx = Sequencer.EffectManager.getEffects({ name: id, object: target });
    if ((activeFx?.length ?? 0) > 0 || (fallbackFx?.length ?? 0) > 0) {
        isPlaying = true;
        break;
    }
}

if (isPlaying) {
    for (const target of targets) {
        const label = `${target.name ?? "Target"} ${id}`;
        Sequencer.EffectManager.endEffects({ name: label, object: target });
        Sequencer.EffectManager.endEffects({ name: id, object: target });
        Sequencer.EffectManager.endEffects({ name: label });
        Sequencer.EffectManager.endEffects({ name: id });
    }
    return;
}

const sequence = new Sequence();

// Caster abjuration activation signs on casting token
sequence.effect()
    .atLocation(token)
    .file(closest("jb2a.markers.light.complete.yellow"))
    .scaleToObject(2)
    .scaleIn(0, 600, { ease: "easeOutCubic" })
    .belowTokens()
    .fadeOut(2000)
    .duration(5000)
    .zIndex(1)
    .filter("ColorMatrix", { saturate: -1, brightness: 1.5 });

sequence.wait(250);

sequence.effect()
    .atLocation(token)
    .file(closest("jb2a.magic_signs.circle.02.conjuration.loop.blue"))
    .scaleToObject(1.25)
    .rotateIn(180, 600, { ease: "easeOutCubic" })
    .scaleIn(0, 600, { ease: "easeOutCubic" })
    .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000 })
    .belowTokens()
    .fadeOut(2000)
    .zIndex(0)
    .filter("ColorMatrix", { hue: -5, saturate: -0.5, brightness: 1.25 });

sequence.effect()
    .atLocation(token)
    .file(closest("jb2a.magic_signs.circle.02.conjuration.loop.blue"))
    .scaleToObject(1.25)
    .rotateIn(180, 600, { ease: "easeOutCubic" })
    .scaleIn(0, 600, { ease: "easeOutCubic" })
    .loopProperty("sprite", "rotation", { from: 0, to: -360, duration: 10000 })
    .belowTokens(true)
    .filter("ColorMatrix", { saturate: -1, brightness: 2 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .zIndex(0.1)
    .duration(1200)
    .fadeIn(200, { ease: "easeOutCirc", delay: 500 })
    .fadeOut(300, { ease: "linear" });

sequence.wait(250);

// Apply holy golden/blue sanctuary shield, particle rays, and persistent aura to targets
for (const target of targets) {
    const targetName = target.name ?? "Target";
    const label = `${targetName} ${id}`;
    const targetRotation = target.document?.rotation ?? target.rotation ?? 0;
    const scaleX = target.document?.texture?.scaleX ?? 1;

    // Glowing sprite image copy of target
    sequence.effect()
        .copySprite(target)
        .spriteRotation(-targetRotation)
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .duration(2000)
        .fadeIn(2000)
        .filter("ColorMatrix", { saturate: -1, brightness: 10 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(0.5)
        .waitUntilFinished(-1500);

    // Dynamic circle pulse border
    sequence.effect()
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.normal"))
        .atLocation(target)
        .scaleToObject(3.25 * scaleX)
        .delay(1200);

    // Floating butterflies divine spark motif (persistent)
    sequence.effect()
        .file(closest("jb2a.fireflies.few.02.yellow"))
        .name(label)
        .scaleToObject(2 * scaleX)
        .opacity(1)
        .fadeIn(2000)
        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
        .persist()
        .private()
        .attachTo(target, { bindRotation: false })
        .fadeOut(750)
        .zIndex(3)
        .delay(1200);

    // Inflow magic circle ground energy (persistent)
    sequence.effect()
        .file(closest("jb2a.extras.tmfx.inflow.circle.03"))
        .name(label)
        .atLocation(target)
        .scaleToObject(scaleX)
        .opacity(0.75)
        .persist()
        .private()
        .attachTo(target)
        .fadeIn(1000)
        .fadeOut(500)
        .zIndex(1)
        .delay(1200);

    // Outflow wave energy
    sequence.effect()
        .file(closest("jb2a.extras.tmfx.outflow.circle.02"))
        .atLocation(target)
        .fadeIn(200)
        .opacity(0.25)
        .duration(10000)
        .scaleToObject(3 * scaleX)
        .fadeOut(500)
        .belowTokens()
        .delay(1200);

    // Warding particle rays outward burst
    sequence.effect()
        .file(closest("jb2a.particles.outward.blue.01.03"))
        .atLocation(target)
        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
        .fadeIn(200, { ease: "easeInExpo" })
        .duration(10000)
        .opacity(0.25)
        .scaleToObject(3 * scaleX)
        .fadeOut(500)
        .belowTokens()
        .delay(1200);

    // Protective shield intro field
    sequence.effect()
        .name(label)
        .file(closest("jb2a.bless.200px.intro.yellow"))
        .atLocation(target)
        .scaleToObject(1.5 * scaleX)
        .fadeIn(2000)
        .opacity(1)
        .waitUntilFinished(-500)
        .zIndex(0);

    // Protective holy shield persistent aura loop
    sequence.effect()
        .name(label)
        .file(closest("jb2a.bless.200px.loop.blue"))
        .scaleToObject(1.5 * scaleX)
        .opacity(0.75)
        .fadeOut(500)
        .persist()
        .attachTo(target, { bindRotation: false })
        .zIndex(0)
        .waitUntilFinished();
}

await sequence.play();
