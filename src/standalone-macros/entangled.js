// Standalone Macro: Entangled
// Author: .eskie

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Entangled' macro requires the 'Sequencer' module to be installed and active!");
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

const id = "entangled";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id} - ${tokenId}`;

// Toggle / re-entrant persistent effect handling
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
if ((activeEffects?.length ?? 0) > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    return;
}

new Sequence()
    .effect()
    .name(label)
    .file(closest('eskie.nature.vine.normal.token.01.physical.green'))
    .attachTo(token)
    .scaleToObject(1.3, { considerTokenScale: true })
    .persist()
    .play();
