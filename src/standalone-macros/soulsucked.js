// Standalone Macro: Emote - Soul Sucked
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Soul Sucked Emote' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const id = "soulsucked";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id}-${tokenId}`;

const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    return;
}

const tokenWidth = token.document?.width ?? 1;
const facingFactor = 1;

let soulSuckedEffect = new Sequence();

soulSuckedEffect.effect()
    .name(label)
    .file(closest("eskie.emote.soul_sucked.01"))
    .atLocation(token)
    .scaleIn(0, 1000, { ease: "easeOutElastic" })
    .scaleOut(0, 1000, { ease: "easeOutExpo" })
    .spriteOffset({ x: -0.45 * tokenWidth * facingFactor, y: -0.25 * tokenWidth }, { gridUnits: true, local: true })
    .scaleToObject(0.7)
    .loopProperty("spriteContainer", "position.y", { from: -0.05, to: 0.05, duration: 3000, gridUnits: true, pingPong: true })
    .attachTo(token, { bindAlpha: false })
    .persist()
    .waitUntilFinished();

await soulSuckedEffect.play();
