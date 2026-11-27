// Standalone Macro: Showcase - Attack Attack Duel
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Attack Attack Duel' macro requires the 'Sequencer' module to be installed and active!");
}

const controlled = Array.from(canvas.tokens.controlled);
const targeted = Array.from(game.user.targets);

let red = controlled[0];
let blue = targeted[0] ?? controlled[1];

const endedMotions =
    (red ? Sequencer.MotionManager.endMotions(red, { name: "gob" }) + Sequencer.MotionManager.endMotions(red, { name: "gob-lock" }) : 0) +
    (blue ? Sequencer.MotionManager.endMotions(blue, { name: "gob" }) + Sequencer.MotionManager.endMotions(blue, { name: "gob-lock" }) : 0);
const isPlaying = endedMotions > 0 ||
                  Sequencer.EffectManager.getEffects({ name: "gob" }).length > 0 ||
                  Sequencer.EffectManager.getEffects({ name: "Trail" }).length > 0;
if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: "gob" });
    Sequencer.EffectManager.endEffects({ name: "Trail" });
    return ui.notifications.info("Stopped Attack Attack duel.");
}

if (!red || !blue || red.id === blue.id) {
    return ui.notifications.warn("Please select 1 token and target 1 opponent token to play the Attack Attack duel show!");
}

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

// Ensure blue is left, red is right
if (blue.x > red.x) {
    const temp = red;
    red = blue;
    blue = temp;
}

const interpolatePos = (r, b, t, count) => {
    const rC = r.center;
    const bC = b.center;
    return {
        x: bC.x + (rC.x - bC.x) * (t / count),
        y: bC.y + (rC.y - bC.y) * (t / count),
    };
};

const positions = {
    b1: interpolatePos(red, blue, 0, 9),
    b2: interpolatePos(red, blue, 4, 9),
    b3: interpolatePos(red, blue, 3, 9),
    b4: interpolatePos(red, blue, 5, 9),
    r1: interpolatePos(red, blue, 9, 9),
    r2: interpolatePos(red, blue, 5, 9),
    r3: interpolatePos(red, blue, 6, 9),
    r4: interpolatePos(red, blue, 4, 9),
};

const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const gridSize = canvas.grid.size;
const zoom = 1.8;
const { b1, b2, b3, r1, r2, r3 } = positions;

const blueCharge = { x: b2.x - b1.x, y: b2.y - b1.y };
const blueRecoil = { x: b3.x - b2.x, y: b3.y - b2.y };
const redCharge = { x: r2.x - r1.x, y: r2.y - r1.y };
const redRecoil = { x: r3.x - r2.x, y: r3.y - r2.y };
const hasBlueTravel = Math.hypot(b3.x - b1.x, b3.y - b1.y) >= 1;
const hasRedTravel = Math.hypot(r3.x - r1.x, r3.y - r1.y) >= 1;

const seq = new Sequence();

// Movement 1: Initial clash charges
const blueChargeMotion = seq.motion(blue)
    .name("gob")
    .moveBy(blueCharge, { delay: 1000, duration: 500, ease: "easeOutQuint", return: false });
if (hasBlueTravel) blueChargeMotion.persistUntilUpdate();

seq.motion(blue)
    .name("gob-lock")
    .oscillate({
        period: 100,
        waveform: "sine",
        delay: 1500,
        x: { amplitude: 0.025 * gridSize, phase: 0 },
    })
    .persist();

const redChargeMotion = seq.motion(red)
    .name("gob")
    .moveBy(redCharge, { delay: 1000, duration: 500, ease: "easeOutQuint", return: false });
if (hasRedTravel) redChargeMotion.persistUntilUpdate();

seq.motion(red)
    .name("gob-lock")
    .oscillate({
        period: 100,
        waveform: "sine",
        delay: 1500,
        x: { amplitude: 0.025 * gridSize, phase: Math.PI },
    })
    .persist();

seq.wait(750);

seq.effect()
    .name("Trail")
    .file(closest("eskie.trail.token.generic.02.blue"))
    .atLocation(blue, { ignoreMotion: true })
    .scaleToObject(1.5)
    .spriteOffset({ x: -0.75 }, { gridUnits: true })
    .moveTowards(b2, { delay: 200, ease: "easeOutQuint", rotate: false })
    .belowTokens()
    .persist();

seq.effect()
    .name("Trail")
    .file(closest("eskie.trail.token.generic.02.red"))
    .atLocation(red, { ignoreMotion: true })
    .scaleToObject(1.5)
    .spriteOffset({ x: 0.75 }, { gridUnits: true })
    .moveTowards(r2, { delay: 200, ease: "easeOutQuint", rotate: false })
    .belowTokens()
    .mirrorX()
    .persist();

seq.wait(400);

seq.canvasPan()
    .atLocation(midpoint(r1, b1))
    .scale(zoom * 0.8);

seq.effect()
    .file(closest("eskie.attack.melee.generic.01.slashing.medium.blue.fast.03"))
    .atLocation(b2, { offset: { x: -0.05 }, gridUnits: true })
    .size(2.25, { gridUnits: true })
    .spriteOffset({ x: -0.25 }, { gridUnits: true })
    .zIndex(2)
    .playbackRate(2);

seq.effect()
    .file(closest("eskie.attack.melee.generic.01.slashing.medium.red.fast.03"))
    .atLocation(r2, { offset: { x: 0.05 }, gridUnits: true })
    .size(2.25, { gridUnits: true })
    .spriteOffset({ x: 0.25 }, { gridUnits: true })
    .mirrorX()
    .zIndex(2)
    .playbackRate(2);

seq.effect()
    .file(closest("eskie.particle.05.orange"))
    .atLocation(b2, { offset: { x: 0.5 }, gridUnits: true })
    .size(4, { gridUnits: true })
    .zIndex(1)
    .randomRotation();

seq.effect()
    .name("gob")
    .delay(150)
    .file(closest("eskie.particle.07.orange"))
    .attachTo(r2, { bindAlpha: false })
    .scaleToObject(1.5)
    .spriteOffset({ x: 0.2, y: -0.15 }, { gridUnits: true })
    .persist()
    .zIndex(1)
    .mirrorX();

seq.effect()
    .name("gob")
    .delay(150)
    .file(closest("eskie.particle.07.orange"))
    .attachTo(b2, { bindAlpha: false })
    .scaleToObject(1.5)
    .spriteOffset({ x: -0.2, y: -0.15 }, { gridUnits: true })
    .persist()
    .zIndex(1);

seq.wait(1000);

seq.thenDo(() => {
    Sequencer.EffectManager.endEffects({ name: "Trail" });
    Sequencer.EffectManager.endEffects({ name: "gob" });
    Sequencer.MotionManager.endMotions(blue, { name: "gob-lock", settle: 0 });
    Sequencer.MotionManager.endMotions(red, { name: "gob-lock", settle: 0 });
});

const blueRecoilMotion = seq.motion(blue)
    .name("gob")
    .moveBy(blueRecoil, { duration: 250, ease: "easeOutCubic", return: false });
if (hasBlueTravel) blueRecoilMotion.persistUntilUpdate();

const redRecoilMotion = seq.motion(red)
    .name("gob")
    .moveBy(redRecoil, { duration: 250, ease: "easeOutCubic", return: false });
if (hasRedTravel) redRecoilMotion.persistUntilUpdate();

seq.wait(250);

if (hasBlueTravel) seq.animation().on(blue).teleportTo(b3, { relativeToCenter: true });
if (hasRedTravel) seq.animation().on(red).teleportTo(r3, { relativeToCenter: true });

await seq.play({ preload: true });
