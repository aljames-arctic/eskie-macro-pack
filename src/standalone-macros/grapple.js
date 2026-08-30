// Standalone Macro: Grapple Latch
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Grapple Latch' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select your grappling token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const id = "Grapple Latch";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id} - ${tokenId}`;

// Toggle release if grapple latch is currently attached
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label });
    return ui.notifications.info(`Released grapple tether.`);
}

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please target an enemy to grapple!");

const sequence = new Sequence();

// Spectral hand tether attached between grappler and target
sequence.effect()
    .name(label)
    .file(closest("eskie.objects.biological.hand.spectral_hand.ranged.01.generic.latch.blue.05ft"))
    .attachTo(token)
    .stretchTo(target, { attachTo: true, offset: { x: 0.5 }, gridUnits: true, local: true })
    .spriteOffset({ x: -0.1 }, { gridUnits: true })
    .spriteScale(3)
    .persist()
    .timeRange(1000, 1500)
    .filter("ColorMatrix", { hue: 75 });

// Wrestling impact smoke at target location
sequence.effect()
    .file(closest("eskie.smoke.03.tan"))
    .attachTo(target, { bindAlpha: false, bindRotation: false })
    .scaleToObject(1.75, { considerTokenScale: true })
    .belowTokens()
    .opacity(0.6)
    .waitUntilFinished();

await sequence.play();
