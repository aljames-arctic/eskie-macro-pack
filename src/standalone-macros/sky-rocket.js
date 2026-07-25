// Standalone Macro: Sky Rocket
// Original Author: Unknown
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Sky Rocket' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct database key if running as a standalone copy-paste macro.
 */
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

const DEFAULT_CONFIG = {
    id: "sky-rocket",
    label: "Sky Rocket",
};

const id = DEFAULT_CONFIG.id ?? "sky-rocket";
const labelName = DEFAULT_CONFIG.label ?? "Sky Rocket";

// Target collection: apply to targeted token(s), or default to selected token
const targets = game.user.targets.size > 0 ? Array.from(game.user.targets) : [token];

// 2. Toggle / Re-entrant Persistent Effect Handling
let isPlaying = false;
for (const target of targets) {
    const targetLabel = `${id}-${target.id}`;
    if (
        Sequencer.EffectManager.getEffects({ name: targetLabel, object: target }).length > 0 ||
        Sequencer.EffectManager.getEffects({ name: targetLabel }).length > 0 ||
        Sequencer.EffectManager.getEffects({ name: labelName, object: target }).length > 0
    ) {
        isPlaying = true;
        break;
    }
}
if (!isPlaying && Sequencer.EffectManager.getEffects({ name: id }).length > 0) {
    isPlaying = true;
}

if (isPlaying) {
    for (const target of targets) {
        const targetLabel = `${id}-${target.id}`;
        Sequencer.EffectManager.endEffects({ name: targetLabel, object: target });
        Sequencer.EffectManager.endEffects({ name: targetLabel });
        Sequencer.EffectManager.endEffects({ name: labelName, object: target });
    }
    Sequencer.EffectManager.endEffects({ name: id });
    Sequencer.EffectManager.endEffects({ name: labelName });
    return;
}

const seq = new Sequence();

for (const target of targets) {
    const targetLabel = `${id}-${target.id}`;

    // Firework celebratory rocket launching upward and bursting sky high
    seq.effect()
        .name(targetLabel)
        .file(closest("jb2a.firework.02.{{color}}"))
        .atLocation(target)
        .setMustache({
            "color": () => {
                const colors = ["orangeyellow.03", "orange.02", "greenred.01", "bluepink.03"];
                return colors[Math.floor(Math.random() * colors.length)] ?? "orangeyellow.03";
            }
        })
        .scale(1)
        .delay(500)
        .zIndex(4);

    // Dynamic high-burst multi-colored stardust sparkles sky-high over target
    seq.effect()
        .name(targetLabel)
        .file(closest("jb2a.particles.outward.blue.02.03"))
        .atLocation(target)
        .filter("ColorMatrix", { saturate: -1, brightness: 2 })
        .duration(7000)
        .fadeOut(3000)
        .scale(1.5)
        .randomRotation()
        .delay(500)
        .zIndex(4);
}

await seq.play();
