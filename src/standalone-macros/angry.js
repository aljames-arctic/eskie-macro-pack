// Standalone Macro: Emote - Angry
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Angry Emote' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const id = "angry";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id}-${tokenId}`;

const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
const activeIdEffects = Sequencer.EffectManager.getEffects({ name: id, object: token }) ?? [];

if (activeEffects.length > 0 || activeIdEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: id, object: token });
    return;
}

const tokenHeight = token.document?.height ?? 1;
const tokenWidth = token.document?.width ?? 1;
const scale = 0.85;
const file = "eskie.emote.angry.02";

let angryEffect = new Sequence();

angryEffect.effect()
    .name(label)
    .file(closest(file))
    .atLocation(token)
    .scaleIn(0, 1000, { ease: "easeOutElastic" })
    .scaleOut(0, 1000, { ease: "easeOutExpo" })
    .spriteOffset({ x: 0.3 * tokenWidth, y: -0.4 * tokenHeight }, { gridUnits: true, local: true })
    .scaleToObject(scale * 0.8)
    .persist()
    .attachTo(token, { bindAlpha: false })
    .loopProperty("alphaFilter", "alpha", { values: [...new Array(8).fill(1), ...new Array(8).fill(-1)], duration: 25, pingPong: false })
    .private();

angryEffect.effect()
    .name(label)
    .file(closest(file))
    .atLocation(token)
    .scaleIn(0, 1000, { ease: "easeOutElastic" })
    .scaleOut(0, 1000, { ease: "easeOutExpo" })
    .spriteOffset({ x: 0.3 * tokenWidth, y: -0.4 * tokenHeight }, { gridUnits: true, local: true })
    .scaleToObject(scale)
    .persist()
    .attachTo(token, { bindAlpha: false })
    .loopProperty("alphaFilter", "alpha", { values: [...new Array(8).fill(-1), ...new Array(8).fill(1)], duration: 25, pingPong: false })
    .waitUntilFinished();

await angryEffect.play();
