// Standalone Macro: Grapple Latch
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Grapple Latch' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select your grappling token!");

const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please target an enemy to grapple!");

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

const id = "Grapple Latch";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id} - ${tokenId}`;

// Toggle release if grapple latch is currently attached
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    return ui.notifications.info(`Released grapple on ${target.name}.`);
}

const sequence = new Sequence();

// Spectral hand tether attached between grappler and target
sequence.effect()
    .name(label)
    .file("modules/eskie-effects/assets/Objects/Biological/Hand/Spectral_Hand/Ranged/01/Objects_Biological_Hand_Spectral_Hand_Ranged_01_Generic_Latch_Blue_05ft.webm")
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
