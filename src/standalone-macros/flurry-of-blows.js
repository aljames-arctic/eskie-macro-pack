// Standalone Macro: Flurry of Blows
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Flurry of Blows' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const target = game.user.targets.first();
if (!target) return ui.notifications.warn("Please select a target!");

const DEFAULT_CONFIG = {
    id: "Flurry Of Blows",
    color: "yellow",
    sound: {
        enabled: true,
        volume: 0.5
    }
};

const id = DEFAULT_CONFIG.id ?? "Flurry Of Blows";
const color = DEFAULT_CONFIG.color ?? "yellow";
const sound = DEFAULT_CONFIG.sound ?? { enabled: true, volume: 0.5 };
const label = `${id}-${token.id}`;

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

// 3. Toggle / Re-entrant Persistent Effect Handling
const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0 ||
                  Sequencer.EffectManager.getEffects({ name: label, object: target }).length > 0 ||
                  Sequencer.EffectManager.getEffects({ name: label }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label, object: target });
    Sequencer.EffectManager.endEffects({ name: label });
    return;
}

const tokenWidth = token.document?.width ?? token.width ?? 1;
const targetRotation = target.document?.rotation ?? target.rotation ?? 0;

let seq = new Sequence();

// First fist strike sound effect
if (sound.enabled ?? true) {
    seq = seq.sound()
        .file(closest("psfx.impacts.bludgeoning"))
        .volume(sound.volume ?? 0.5)
        .delay(125)
        .repeats(7, 250, 250);
}

// First fist rapid strike series
seq = seq.effect()
    .name(label)
    .delay(125)
    .file(closest(`jb2a.melee_generic.creature_attack.fist.001.${color}`))
    .atLocation(token, { offset: { x: -0.75, y: -0.2 }, gridUnits: true, local: true })
    .rotateTowards(target, { randomOffset: 0.15 })
    .scaleToObject(2.5)
    .playbackRate(2.5)
    .spriteOffset({ x: -0.05 - (tokenWidth - 1), y: -0.18 * tokenWidth }, { gridUnits: true })
    .repeats(7, 250, 250)
    .zIndex(1);

// Second fist strike sound effect
if (sound.enabled ?? true) {
    seq = seq.sound()
        .file(closest("psfx.impacts.bludgeoning"))
        .volume(sound.volume ?? 0.5)
        .delay(250)
        .repeats(7, 250, 250);
}

// Second (mirrored) fist rapid strike series
seq = seq.effect()
    .name(label)
    .delay(250)
    .file(closest(`jb2a.melee_generic.creature_attack.fist.001.${color}`))
    .atLocation(token, { offset: { x: -0.75, y: 0.2 }, gridUnits: true, local: true })
    .rotateTowards(target, { randomOffset: 0.15 })
    .scaleToObject(2.5)
    .playbackRate(2.5)
    .spriteOffset({ x: -0.05 - (tokenWidth - 1), y: 0.18 * tokenWidth }, { gridUnits: true })
    .repeats(7, 250, 250)
    .mirrorY()
    .zIndex(1);

seq = seq.wait(250);

// Multi-fist rapid martial strike punch impact flares
seq = seq.effect()
    .name(label)
    .file(closest("jb2a.impact.009.orange"))
    .atLocation(target, { randomOffset: 1 })
    .size(tokenWidth * 1.25, { gridUnits: true })
    .repeats(14, 125, 125)
    .randomRotation();

// Target physical shockwave / hit-reaction shake burst
seq = seq.effect()
    .name(label)
    .copySprite(target)
    .spriteRotation(-targetRotation)
    .atLocation(target)
    .scaleToObject(1, { considerTokenScale: true })
    .fadeIn(200)
    .fadeOut(200)
    .loopProperty("spriteContainer", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
    .duration(1750)
    .opacity(0.25);

await seq.play();
