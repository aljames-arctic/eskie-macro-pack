// Standalone Macro: Firecracker
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Firecracker' macro requires the 'Sequencer' module to be installed and active!");
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
    id: "firecracker",
    label: "Firecracker",
};

const id = DEFAULT_CONFIG.id ?? "firecracker";
const labelName = DEFAULT_CONFIG.label ?? "Firecracker";
const effectName = `${id}-${token.id}`;

// 2. Toggle / Re-entrant Persistent Effect Handling
const isPlaying = Sequencer.EffectManager.getEffects({ name: id }).length > 0 ||
    Sequencer.EffectManager.getEffects({ name: labelName }).length > 0 ||
    Sequencer.EffectManager.getEffects({ name: effectName }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: id });
    Sequencer.EffectManager.endEffects({ name: labelName });
    Sequencer.EffectManager.endEffects({ name: effectName });
    return;
}

// Target point placement: decouple from template if provided in scope, else show Crosshair picker
let position;
if (typeof scope !== "undefined" && scope?.template) {
    position = { x: scope.template.x, y: scope.template.y };
} else {
    const crosshairConfig = {
        size: 1,
        icon: "icons/weapons/explosives/firecracker-triple.webp",
        label: "Firecracker Target",
        drawIcon: true,
        drawOutline: true,
        rememberControlled: true,
    };
    position = await Sequencer.Crosshair.show(crosshairConfig);
    if (!position || position.cancelled) return;
}

if (!position) return;

const impactColors = [
    "jb2a.impact.002.yellow",
    "jb2a.impact.003.yellow",
    "jb2a.impact.009.orange",
    "jb2a.impact.008.orange",
    "jb2a.impact.004.blue"
];

const seq = new Sequence();

// Sizzling firecracker fuse spark line from controlled token to targeted template location
seq.effect()
    .name(effectName)
    .file(closest("jb2a.bolt.fire.orange"))
    .atLocation(token)
    .stretchTo(position)
    .playbackRate(2.5)
    .scale(0.7)
    .duration(450)
    .fadeOut(100)
    .waitUntilFinished(-50);

seq.effect()
    .name(effectName)
    .file(closest("jb2a.bolt.fire.yellow"))
    .atLocation(token)
    .stretchTo(position)
    .playbackRate(3.0)
    .scale(0.5)
    .duration(400)
    .fadeOut(100);

// Wave 1: Rapid wave of popping multi-color mini firecracker explosions across template point
seq.effect()
    .name(effectName)
    .repeats(10, 50, 50)
    .file(() => closest(impactColors[Math.floor(Math.random() * impactColors.length)]))
    .atLocation(position, { randomOffset: 1.0 })
    .size(0.8, { gridUnits: true })
    .randomRotation()
    .delay(100);

// Wave 2: Second popping multi-color burst across the target area
seq.effect()
    .name(effectName)
    .repeats(6, 50, 50)
    .file(() => closest(impactColors[Math.floor(Math.random() * impactColors.length)]))
    .atLocation(position, { randomOffset: 1.0 })
    .size(0.8, { gridUnits: true })
    .randomRotation()
    .delay(600);

// Wave 3: Final popping flurry of mini firecrackers
seq.effect()
    .name(effectName)
    .repeats(6, 50, 50)
    .file(() => closest(impactColors[Math.floor(Math.random() * impactColors.length)]))
    .atLocation(position, { randomOffset: 1.0 })
    .size(0.8, { gridUnits: true })
    .randomRotation()
    .delay(350);

// Outward smoky orange particle cloud from firecracker blast
seq.effect()
    .name(effectName)
    .file(closest("jb2a.particles.outward.orange.02.03"))
    .atLocation(position)
    .duration(5000)
    .fadeOut(1500)
    .scale(0.5)
    .randomRotation()
    .delay(200);

await seq.play();
