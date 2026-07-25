// Standalone Macro: Surprised
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Surprised' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

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

const id = "surprised";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `Surprised - ${tokenId}`;

// Toggle / re-entrant persistent effect handling: end surprised effect if active
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
const activeIdEffects = Sequencer.EffectManager.getEffects({ name: id, object: token }) ?? [];

if ((activeEffects?.length ?? 0) > 0 || (activeIdEffects?.length ?? 0) > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: id, object: token });
    return;
}

const tokenRotation = token.document?.rotation ?? token.rotation ?? 0;
const resolvedExclaim = closest("eskie.emote.exclaim.01");
const exclaimImg = (resolvedExclaim && resolvedExclaim !== "eskie.emote.exclaim.01") ? resolvedExclaim : "https://i.imgur.com/8Yr9fMC.png";

const sequence = new Sequence();

// Token startle twitch (quick startled shudder & jump twitch on activation)
sequence.effect()
    .copySprite(token)
    .spriteRotation(-tokenRotation)
    .attachTo(token)
    .scaleToObject(1, { considerTokenScale: true })
    .duration(350)
    .fadeIn(30)
    .fadeOut(100)
    .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.15, duration: 100, gridUnits: true, ease: "easeOutQuad" })
    .animateProperty("spriteContainer", "position.y", { from: -0.15, to: 0, duration: 120, delay: 100, gridUnits: true, ease: "easeInQuad" })
    .loopProperty("spriteContainer", "position.x", { from: -0.03, to: 0.03, duration: 35, pingPong: true, gridUnits: true })
    .zIndex(1);

// Red exclaim exclamation point mark pop (eskie.emote.exclaim.01) above token with jump vertical spring scale-up
sequence.effect()
    .name(label)
    .file(exclaimImg)
    .atLocation(token)
    .anchor({ x: 0.5, y: 1.55 })
    .scaleIn(0, 500, { ease: "easeOutElastic" })
    .scaleOut(0, 500, { ease: "easeOutExpo" })
    .loopProperty("spriteContainer", "position.y", { from: 0, to: -15, duration: 750, pingPong: true })
    .persist()
    .scaleToObject(0.6)
    .attachTo(token, { bindAlpha: false });

await sequence.play();
