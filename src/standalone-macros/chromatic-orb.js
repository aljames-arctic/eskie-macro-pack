// Standalone Macro: Chromatic Orb
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Chromatic Orb' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please select at least one target!");
}

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

const id = "ChromaticOrb";
const label = `${id}-${token.id ?? ""}`;

// 3. Toggle / Re-entrant Persistent Effect Handling
const isPlaying = Sequencer.EffectManager.getEffects({ name: label }).length > 0 ||
                  Sequencer.EffectManager.getEffects({ name: id }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label });
    Sequencer.EffectManager.endEffects({ name: id });
    for (const target of targets) {
        Sequencer.EffectManager.endEffects({ name: label, object: target });
        Sequencer.EffectManager.endEffects({ name: id, object: target });
    }
    return;
}

// 4. Interactive Element Chooser (Acid, Cold, Fire, Lightning, Poison, Thunder)
const damageType = await Dialog.wait({
    title: "Chromatic Orb: Choose Element",
    content: "<p style='text-align: center;'>Select elemental energy type for Chromatic Orb:</p>",
    buttons: {
        acid: {
            icon: '<i class="fas fa-flask" style="color: #44ff44;"></i>',
            label: "Acid",
            callback: () => "acid"
        },
        cold: {
            icon: '<i class="fas fa-snowflake" style="color: #00aaff;"></i>',
            label: "Cold",
            callback: () => "cold"
        },
        fire: {
            icon: '<i class="fas fa-fire" style="color: #ff5500;"></i>',
            label: "Fire",
            callback: () => "fire"
        },
        lightning: {
            icon: '<i class="fas fa-bolt" style="color: #ffff00;"></i>',
            label: "Lightning",
            callback: () => "lightning"
        },
        poison: {
            icon: '<i class="fas fa-skull-crossbones" style="color: #88ff00;"></i>',
            label: "Poison",
            callback: () => "poison"
        },
        thunder: {
            icon: '<i class="fas fa-cloud-showers-heavy" style="color: #88ccff;"></i>',
            label: "Thunder",
            callback: () => "thunder"
        }
    },
    default: "fire",
    close: () => null
});

if (!damageType) return;

const colorMapping = {
    acid: { color: "green", orb: "yellow", hue: 20, impact: "green" },
    cold: { color: "blue", orb: "blue", hue: 0, impact: "blue" },
    fire: { color: "orange", orb: "yellow", hue: -15, impact: "orange" },
    lightning: { color: "purple", orb: "green", hue: 180, impact: "pinkpurple" },
    poison: { color: "green", orb: "green", hue: -20, impact: "green" },
    thunder: { color: "white", orb: "white", hue: 0, impact: "blue" },
};

const { color, orb, hue, impact } = colorMapping[damageType] ?? colorMapping.fire;
const gridSize = canvas.grid?.size ?? 100;

const sequence = new Sequence();

for (const target of targets) {
    const targetCenterX = target.center?.x ?? target.x ?? 0;
    const targetCenterY = target.center?.y ?? target.y ?? 0;
    const tokenCenterX = token.center?.x ?? token.x ?? 0;
    const tokenCenterY = token.center?.y ?? token.y ?? 0;

    // Calculate distance in grid units
    const dx = targetCenterX - tokenCenterX;
    const dy = targetCenterY - tokenCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy) / gridSize;

    const effectDuration = 800 + (100 * distance);
    const effectOffsetX = Math.round((Math.random() - 0.5) * (gridSize / 2));
    const effectOffsetY = Math.round((Math.random() - 0.5) * (gridSize / 2));
    const targetPos = { x: targetCenterX + effectOffsetX, y: targetCenterY + effectOffsetY };

    sequence
        .addNamedLocation("position", targetPos)

        .effect()
            .name(label)
            .file(closest("jb2a.aura_themed.01.orbit.complete.metal.01.grey"))
            .atLocation(token)
            .scaleToObject(1.75)
            .fadeIn(500)
            .animateProperty('sprite', 'width', { from: 0, to: -1, duration: 1500, gridUnits: true, ease: "easeOutCubic" })
            .animateProperty('sprite', 'height', { from: 0, to: -1, duration: 1500, gridUnits: true, ease: "easeOutCubic" })
            .startTime(5500)
            .zIndex(1)

        .effect()
            .name(label)
            .file(closest("jb2a.moonbeam.01.complete.rainbow"))
            .atLocation(token)
            .scaleToObject(1.5)
            .fadeIn(500)
            .animateProperty('sprite', 'width', { from: 0, to: -1, duration: 1500, gridUnits: true, ease: "easeOutCubic" })
            .animateProperty('sprite', 'height', { from: 0, to: -1, duration: 1500, gridUnits: true, ease: "easeOutCubic" })
            .playbackRate(1.25)
            .fadeOut(250)
            .duration(2500)

        .wait(1500)

        .effect()
            .name(label)
            .file(closest(`jb2a.impact.002.${impact}`))
            .atLocation(token)
            .scaleToObject(1)
            .zIndex(3)

        // Orb missile flying toward target
        .effect()
            .name(label)
            .file(closest(`jb2a.markers.light_orb.loop.${orb}`))
            .atLocation(token)
            .scaleIn(0, 500, { ease: "easeOutBack" })
            .moveTowards("position", { delay: 500, ease: "easeInBack" })
            .scaleToObject(1)
            .filter("ColorMatrix", { hue: hue, saturate: 1 })
            .fadeIn(250)
            .duration(effectDuration)
            .zIndex(2)

        // Rainbow light trail accompanying orb flight
        .effect()
            .name(label)
            .file(closest("jb2a.moonbeam.01.loop.rainbow"))
            .atLocation(token)
            .moveTowards("position", { delay: 500, ease: "easeInBack" })
            .scaleToObject(0.45)
            .fadeIn(250)
            .duration(effectDuration)
            .zIndex(1)
            .waitUntilFinished(-100)

        // Elemental splash impact explosion animation
        .effect()
            .name(label)
            .file(closest(`eskie.damage.${damageType}.01.${color}`))
            .atLocation("position")
            .size(1, { gridUnits: true });
}

await sequence.play();
