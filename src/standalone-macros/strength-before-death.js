// Standalone Macro: Strength Before Death
// Original Author: .eskie

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Strength Before Death' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const id = "Strength Before Death";
const tokenName = token.name ?? "Token";
const label = `${id} ${tokenName}`;
const tintMap = true;
const cinemaBars = true;

// Toggle / re-entrant persistent effect handling: stop active effect if present
const activeEffects = [
    ...Sequencer.EffectManager.getEffects({ name: label, object: token }),
    ...Sequencer.EffectManager.getEffects({ name: label })
];

if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label });
    return;
}

// Scene bounds in canvas coords (handles scenes that don't start at 0,0)
const rect = canvas.dimensions?.sceneRect ?? { x: 0, y: 0, width: canvas.dimensions?.width ?? 4000, height: canvas.dimensions?.height ?? 4000 };
const left   = rect.x;
const top    = rect.y;
const right  = rect.x + rect.width;
const bottom = rect.y + rect.height;

// Token center in canvas coords
const center = token.center ?? { x: token.x, y: token.y };
const cx = center.x;
const cy = center.y;

const gridScale = canvas.grid?.size ?? 100;

// Max distance (in pixels) from token center to any edge
const maxPx = Math.max(
    cx - left,
    right - cx,
    cy - top,
    bottom - cy
);

// Convert pixels -> grid units
const radiusGU = maxPx / gridScale;
const tokenRotation = token.document?.rotation ?? token.rotation ?? 0;

const seq = new Sequence()
    .effect()
        .name(label)
        .atLocation(token)
        .shape("circle", {
            radius: radiusGU,
            gridUnits: true,
            name: "test",
            fillAlpha: 0.75,
            fillColor: "#000000"
        })
        .belowTiles()
        .fadeIn(1000)
        .fadeOut(2000)
        .duration(7000)
        .filter("Blur", { blurX: 10, blurY: 10 })
        .animateProperty("shapes.test", "scale.x", { from: 0, to: 1.1, duration: 4500, ease: "easeInSine" })
        .animateProperty("shapes.test", "scale.y", { from: 0, to: 1.1, duration: 4500, ease: "easeInSine" })
        .persist(tintMap)

    .effect()
        .delay(1000)
        .name(label)
        .file(closest("eskie.screen_overlay.cinema_bars.01"))
        .screenSpace()
        .screenSpaceScale({ fitX: true, fitY: true })
        .persist()
        .playIf(cinemaBars)

    .wait(4500)

    .effect()
        .delay(50)
        .file(closest("jb2a.impact.ground_crack.02.orange"))
        .attachTo(token)
        .scaleToObject(2.5)
        .filter("ColorMatrix", { hue: -15, saturate: 1 })
        .belowTokens()

    .effect()
        .delay(250)
        .file(closest("jb2a.extras.tmfx.border.circle.outpulse.01.fast"))
        .attachTo(token)
        .scaleToObject(5)
        .opacity(0.15)
        .belowTokens()

    .effect()
        .file(closest("eskie.aura.token.generic.01.red"))
        .attachTo(token)
        .scaleToObject(2.2)
        .animateProperty("spriteContainer", "scale.y", { from: 0, to: 1.5, duration: 1500, ease: "easeOutQuint" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.25, duration: 1500, ease: "easeOutQuint", gridUnits: true })
        .belowTokens()
        .duration(1750)
        .fadeOut(1000)
        .filter("ColorMatrix", { hue: -7 })
        .zIndex(2)

    .canvasPan()
    .shake({ duration: 500, strength: 1.5, rotation: false, fadeOut: 250 })

    .effect()
        .name(label)
        .file(closest("eskie.nature.flower.particle.01.red"))
        .attachTo(token, { offset: { y: 0.25 }, gridUnits: true })
        .scaleToObject(1.5)
        .fadeIn(250, { ease: "easeOutQuint" })
        .fadeOut(1000, { ease: "easeOutQuint" })
        .spriteRotation(20)
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 1000, gridUnits: true, ease: "easeOutCubic" })
        .belowTokens()
        .persist()

    .wait(100)

    .effect()
        .file(closest("eskie.nature.flower.particle.01.red"))
        .attachTo(token, { offset: { x: -1, y: -1 }, gridUnits: true, randomOffset: 1 })
        .scaleToObject(2)
        .fadeIn(250, { ease: "easeOutQuint" })
        .fadeOut(1000, { ease: "easeOutSine" })
        .duration(1250)
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -1, duration: 1000, gridUnits: true, ease: "easeOutSine" })
        .opacity(0.8)

    .effect()
        .file(closest("eskie.nature.flower.particle.01.red"))
        .attachTo(token, { offset: { x: 1, y: -1 }, gridUnits: true, randomOffset: 1 })
        .scaleToObject(2)
        .fadeIn(250, { ease: "easeOutQuint" })
        .fadeOut(1000, { ease: "easeOutSine" })
        .duration(1250)
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -1, duration: 1000, gridUnits: true, ease: "easeOutSine" })
        .opacity(0.8)

    .effect()
        .file(closest("eskie.nature.flower.particle.01.red"))
        .attachTo(token, { offset: { x: -1, y: 1 }, gridUnits: true, randomOffset: 1 })
        .scaleToObject(2)
        .fadeIn(250, { ease: "easeOutQuint" })
        .fadeOut(1000, { ease: "easeOutSine" })
        .duration(1250)
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -1, duration: 1000, gridUnits: true, ease: "easeOutSine" })
        .opacity(0.8)

    .effect()
        .file(closest("eskie.nature.flower.particle.01.red"))
        .attachTo(token, { offset: { x: 1, y: 1 }, gridUnits: true, randomOffset: 1 })
        .scaleToObject(2)
        .fadeIn(250, { ease: "easeOutQuint" })
        .fadeOut(1000, { ease: "easeOutSine" })
        .duration(1250)
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -1, duration: 1000, gridUnits: true, ease: "easeOutSine" })
        .opacity(0.8)

    .effect()
        .file(closest("eskie.nature.flower.particle.01.red"))
        .attachTo(token, { offset: { x: 2, y: 0 }, gridUnits: true, randomOffset: 1 })
        .scaleToObject(2)
        .fadeIn(250, { ease: "easeOutQuint" })
        .fadeOut(1000, { ease: "easeOutSine" })
        .duration(1250)
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -1, duration: 1000, gridUnits: true, ease: "easeOutSine" })
        .opacity(0.8)

    .effect()
        .file(closest("eskie.nature.flower.particle.01.red"))
        .attachTo(token, { offset: { x: 0, y: 1.5 }, gridUnits: true, randomOffset: 1 })
        .scaleToObject(2)
        .fadeIn(250, { ease: "easeOutQuint" })
        .fadeOut(1000, { ease: "easeOutSine" })
        .duration(1250)
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -1, duration: 1000, gridUnits: true, ease: "easeOutSine" })
        .opacity(0.8)

    .effect()
        .file(closest("eskie.nature.flower.particle.01.red"))
        .attachTo(token, { offset: { x: -2, y: 0 }, gridUnits: true, randomOffset: 1 })
        .scaleToObject(2)
        .fadeIn(250, { ease: "easeOutQuint" })
        .fadeOut(1000, { ease: "easeOutSine" })
        .duration(1250)
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -1, duration: 1000, gridUnits: true, ease: "easeOutSine" })
        .opacity(0.8)

    .effect()
        .file(closest("eskie.nature.flower.particle.01.red"))
        .attachTo(token, { offset: { x: 0, y: -1.5 }, gridUnits: true, randomOffset: 1 })
        .scaleToObject(2)
        .fadeIn(250, { ease: "easeOutQuint" })
        .fadeOut(1000, { ease: "easeOutSine" })
        .duration(1250)
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -1, duration: 1000, gridUnits: true, ease: "easeOutSine" })
        .opacity(0.8)

    .effect()
        .delay(50, 250)
        .file(closest("eskie.nature.flower.particle.01.red"))
        .attachTo(token, { offset: { x: -1, y: -1 }, gridUnits: true, randomOffset: 1 })
        .scaleToObject(1.5)
        .fadeIn(250, { ease: "easeOutQuint" })
        .fadeOut(3000, { ease: "easeOutSine" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 1000, gridUnits: true, ease: "easeOutSine" })

    .effect()
        .delay(50, 250)
        .file(closest("eskie.nature.flower.particle.01.red"))
        .attachTo(token, { offset: { x: 1, y: -1 }, gridUnits: true, randomOffset: 1 })
        .scaleToObject(1.5)
        .fadeIn(250, { ease: "easeOutQuint" })
        .fadeOut(3000, { ease: "easeOutSine" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 1000, gridUnits: true, ease: "easeOutSine" })

    .effect()
        .delay(50, 250)
        .file(closest("eskie.nature.flower.particle.01.red"))
        .attachTo(token, { offset: { x: -1, y: 1 }, gridUnits: true, randomOffset: 1 })
        .scaleToObject(1.5)
        .fadeIn(250, { ease: "easeOutQuint" })
        .fadeOut(3000, { ease: "easeOutSine" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 1000, gridUnits: true, ease: "easeOutSine" })

    .effect()
        .delay(50, 250)
        .file(closest("eskie.nature.flower.particle.01.red"))
        .attachTo(token, { offset: { x: 1, y: 1 }, gridUnits: true, randomOffset: 1 })
        .scaleToObject(1.5)
        .fadeIn(250, { ease: "easeOutQuint" })
        .fadeOut(3000, { ease: "easeOutSine" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 1000, gridUnits: true, ease: "easeOutSine" })

    .effect()
        .file(closest("eskie.nature.flower.particle.01.red"))
        .attachTo(token, { offset: { x: 2, y: 0 }, gridUnits: true, randomOffset: 1 })
        .scaleToObject(1.5)
        .fadeIn(250, { ease: "easeOutQuint" })
        .fadeOut(3000, { ease: "easeOutSine" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 1000, gridUnits: true, ease: "easeOutSine" })

    .effect()
        .file(closest("eskie.nature.flower.particle.01.red"))
        .attachTo(token, { offset: { x: 0, y: 1.5 }, gridUnits: true, randomOffset: 1 })
        .scaleToObject(1.5)
        .fadeIn(250, { ease: "easeOutQuint" })
        .fadeOut(3000, { ease: "easeOutSine" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 1000, gridUnits: true, ease: "easeOutSine" })

    .effect()
        .file(closest("eskie.nature.flower.particle.01.red"))
        .attachTo(token, { offset: { x: -2, y: 0 }, gridUnits: true, randomOffset: 1 })
        .scaleToObject(1.5)
        .fadeIn(250, { ease: "easeOutQuint" })
        .fadeOut(3000, { ease: "easeOutSine" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 1000, gridUnits: true, ease: "easeOutSine" })

    .effect()
        .file(closest("eskie.nature.flower.particle.01.red"))
        .attachTo(token, { offset: { x: 0, y: -1.5 }, gridUnits: true, randomOffset: 1 })
        .scaleToObject(1.5)
        .fadeIn(250, { ease: "easeOutQuint" })
        .fadeOut(3000, { ease: "easeOutSine" })
        .animateProperty("spriteContainer", "position.y", { from: 0, to: -0.5, duration: 1000, gridUnits: true, ease: "easeOutSine" })

    .effect()
        .name(label)
        .copySprite(token)
        .spriteRotation(-tokenRotation)
        .attachTo(token)
        .scaleToObject(1, { considerTokenScale: true })
        .mask(token)
        .opacity(0.25)
        .loopProperty("sprite", "scale.y", { from: 1, to: 1.25, duration: 2000, ease: "easeInOutSine" })
        .loopProperty("sprite", "scale.x", { from: 1, to: 1.25, duration: 2000, ease: "easeInOutSine" })
        .loopProperty("sprite", "alpha", { from: 0.25, to: -0.25, duration: 2000, ease: "easeInOutSine" })
        .persist();

await seq.play();
