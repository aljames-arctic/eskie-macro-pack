// Standalone Macro: Emote - Shout
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Shout Emote' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const id = "shout";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id}-${tokenId}`;

const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    return;
}

const tokenWidth = token.document?.width ?? 1;
const facingFactor = 1;

let shoutEffect = new Sequence();

shoutEffect.effect()
    .name(label)
    .file(closest("eskie.emote.shout.01"))
    .atLocation(token, { offset: { x: 0.4 * tokenWidth * facingFactor, y: -0.6 * tokenWidth }, gridUnits: true, local: true })
    .spriteRotation(-15 * facingFactor)
    .loopProperty("sprite", "rotation", { from: 0, to: -10 * facingFactor, duration: 250, ease: "easeOutCubic" })
    .loopProperty("spriteContainer", "position.y", { from: 0, to: -0.025, duration: 250, gridUnits: true, pingPong: false })
    .loopProperty("spriteContainer", "position.x", { from: 0, to: -0.025 * facingFactor, duration: 250, gridUnits: true, pingPong: false })
    .scaleToObject(0.9)
    .attachTo(token, { bindAlpha: false })
    .persist()
    .waitUntilFinished(-200);

await shoutEffect.play();
