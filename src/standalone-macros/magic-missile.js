// Standalone Macro: Magic Missile
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Magic Missile' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please target at least one token!");
}

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to the default path if running as a standalone copy-paste macro.
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
    id: "magicMissile",
    missileCount: 3,
};

const id = DEFAULT_CONFIG.id ?? "magicMissile";
const label = `${id}-${token.id}`;

// 3. Toggle / Re-entrant Persistent Effect Handling
const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0 ||
                  Sequencer.EffectManager.getEffects({ name: label }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label });
    return;
}

const missileCount = DEFAULT_CONFIG.missileCount ?? 3;
const mCount = Math.max(missileCount, targets.length);

const seq = new Sequence();

// Orbit tuning (grid units)
const orbitRadius = 0.55;
const orbitDirection = 1;

// Dynamic orbit mapping (1 → 9)
const clamped = Math.min(Math.max(mCount, 1), 9);
const t = (clamped - 1) / 8;

const orbitStartAngle = 0 + (-90 - 0) * t;   // 0 → -90
const orbitSpread     = 0 + (180 - 0) * t;   // 0 → 180

const steps = Math.max(mCount - 1, 1);
const stepAngle = orbitSpread / steps;

// Precompute per-missile data
const missiles = [];
const colors = ["blue", "purple", "grey"];

for (let m = 0; m < mCount; m++) {
    const color = colors[Math.floor(Math.random() * colors.length)] ?? "blue";

    let starColor = color;
    if (color === "grey") starColor = "white";

    const angleDeg = orbitStartAngle + orbitDirection * (m * stepAngle);
    const angleRad = angleDeg * (Math.PI / 180);

    const offsetArc = {
        x: Math.cos(angleRad) * orbitRadius,
        y: Math.sin(angleRad) * orbitRadius
    };

    const target = targets[m % targets.length];

    missiles.push({ m, color, starColor, offsetArc, target });
}

// -------------------------
// PASS 1: Stars
// -------------------------
for (const missile of missiles) {
    seq.effect()
        .name(label)
        .file(closest(`eskie.star.02.${missile.starColor}`))
        .attachTo(token, {
            offset: { x: missile.offsetArc.x, y: missile.offsetArc.y },
            gridUnits: true,
            local: true
        })
        .size(0.5, { gridUnits: true })
        .rotateTowards(missile.target)
        .spriteOffset({ x: -0.25 }, { gridUnits: true })
        .playbackRate(1.25)
        .zIndex(2)
        .rotateIn(180, 500, { ease: "easeOutCubic" })
        .opacity(0.8)
        .waitUntilFinished(-1550);
}

seq.wait(250);

// ------------------------------
// PASS 2: Missiles
// ------------------------------
for (const missile of missiles) {
    const missileDelay = 100 + (missile.m * 250);

    seq.effect()
        .name(label)
        .delay(missileDelay)
        .file(closest(`jb2a.magic_missile.${missile.color}`))
        .attachTo(token, {
            offset: { x: missile.offsetArc.x, y: missile.offsetArc.y },
            gridUnits: true,
            local: true
        })
        .scale(0.6)
        .stretchTo(missile.target, { randomOffset: 0.5 })
        .randomizeMirrorY()
        .playbackRate(1.25)
        .zIndex(1);
}

await seq.play();
