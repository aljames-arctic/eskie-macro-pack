// Standalone Macro: Guiding Bolt
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Guiding Bolt' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please select at least one target!");
}

const DEFAULT_CONFIG = {
    id: "GuidingBolt",
};

const id = DEFAULT_CONFIG.id ?? "GuidingBolt";

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct database key if running as a standalone copy-paste macro.
 */
const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

// 3. Toggle / Re-entrant Persistent Effect Handling
let isPlaying = false;
for (const target of targets) {
    const activeFx = Sequencer.EffectManager.getEffects({ name: id, object: target });
    if (activeFx.length > 0) {
        isPlaying = true;
        break;
    }
}
if (!isPlaying && Sequencer.EffectManager.getEffects({ name: id }).length > 0) {
    isPlaying = true;
}

if (isPlaying) {
    for (const target of targets) {
        Sequencer.EffectManager.endEffects({ name: id, object: target });
    }
    Sequencer.EffectManager.endEffects({ name: id });
    return;
}

const sequence = new Sequence();

for (const target of targets) {
    const scaleX = target.document?.texture?.scaleX ?? 1;
    const rotation = target.document?.rotation ?? 0;

    // Caster charging spell circle
    sequence.effect()
        .atLocation(token)
        .file(closest("jb2a.markers.light.complete.yellow"))
        .scaleToObject(2)
        .scaleIn(0, 600, { ease: "easeOutCubic" })
        .belowTokens()
        .fadeOut(2000)
        .duration(5000)
        .zIndex(0);

    sequence.wait(250);

    sequence.effect()
        .atLocation(token)
        .file(closest("jb2a.magic_signs.circle.02.evocation.loop.yellow"))
        .scaleToObject(1.25)
        .rotateIn(180, 600, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeOutCubic" })
        .loopProperty('sprite', "rotation", { from: 0, to: -360, duration: 10000 })
        .belowTokens()
        .fadeOut(2000)
        .filter("ColorMatrix", { hue: 5, saturate: 0, brightness: 1.2 })
        .zIndex(0);

    sequence.effect()
        .atLocation(token)
        .file(closest("jb2a.magic_signs.circle.02.evocation.loop.yellow"))
        .scaleToObject(1.25)
        .rotateIn(180, 600, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeOutCubic" })
        .loopProperty('sprite', "rotation", { from: 0, to: -360, duration: 10000 })
        .belowTokens(true)
        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .zIndex(0.1)
        .duration(1200)
        .fadeIn(200, { ease: "easeOutCirc", delay: 500 })
        .fadeOut(300, { ease: "linear" });

    sequence.wait(250);

    // Radiant golden beam projectile
    sequence.effect()
        .file(closest("jb2a.guiding_bolt.01.yellow"))
        .attachTo(token)
        .stretchTo(target, { attachTo: true })
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .zIndex(2)
        .waitUntilFinished(-2000);

    // Target impact flash & shake
    sequence.effect()
        .copySprite(target)
        .spriteRotation(-rotation)
        .atLocation(target)
        .scaleToObject(1, { considerTokenScale: true })
        .loopProperty('spriteContainer', 'position.x', { from: -0.025, to: 0.025, duration: 75, pingPong: true, gridUnits: true })
        .fadeIn(100)
        .fadeOut(400)
        .duration(500)
        .opacity(0.5);

    // Persistent luminous mark outline on target (Outpulse border background)
    sequence.effect()
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.02.normal"))
        .attachTo(target)
        .fadeIn(250)
        .fadeOut(500)
        .scaleToObject(1.075 * scaleX)
        .tint(0xfbd328)
        .belowTokens()
        .zIndex(1)
        .persist()
        .name(id);

    // Persistent luminous mark outline mask border
    sequence.effect()
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.02.normal"))
        .attachTo(target)
        .fadeIn(250)
        .fadeOut(500)
        .scaleToObject(scaleX)
        .tint(0xfbd328)
        .zIndex(1)
        .persist()
        .name(id)
        .mask();

    // Persistent golden radiant particle aura inside mark
    sequence.effect()
        .file(closest("jb2a.particles.outward.orange.02.03"))
        .attachTo(target)
        .fadeIn(1000)
        .scaleToObject(scaleX * 1.5)
        .scaleIn(0, 500, { ease: "easeOutCirc" })
        .zIndex(1)
        .filter("ColorMatrix", { hue: -5, saturate: -0.2, brightness: 1.2 })
        .persist()
        .randomRotation()
        .name(id)
        .mask(target);
}

await sequence.play();
