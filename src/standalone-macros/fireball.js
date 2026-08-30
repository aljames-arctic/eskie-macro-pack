// Standalone Macro: Fireball
// Original Author: .eskie
// Editor: Papa Nurgle
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Fireball' macro requires the 'Sequencer' module to be installed and active!");
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

const radius = 20;
const scorchedEarth = true;
const persistEffect = false;
const tintMap = true;

const AVAILABLE_SIZES = [10, 20, 30, 60];
const effectSize = AVAILABLE_SIZES.reduce((acc, size) => (size <= radius ? size : acc), AVAILABLE_SIZES[0]);

const tokenWidth = token.document?.width ?? token.width ?? 1;
const tokenOffset = (tokenWidth - 1) / 2;

const bgSrc = typeof eskie !== "undefined" && eskie.util?.adapter?.getSceneBackground
    ? eskie.util.adapter.getSceneBackground(canvas.scene)
    : (canvas.scene?.background?.src ?? "");

const sequence = new Sequence();

sequence
    .crosshair("position")
        .type("circle")
        .distance(radius)
        .borderColor("#ffffff", { alpha: 0 })
        .fillColor("#000000", { alpha: 0.1 })
        .icon(token.document?.texture?.src ?? "")
        .callback(Sequencer.Crosshair.CALLBACKS.SHOW, function(crosshair) {
            new Sequence()
                .wait(100)
                .effect()
                    .name("Circle Crosshair")
                    .file(closest("eskie.crosshair.line.generic_01.white"))
                    .attachTo(token)
                    .stretchTo(crosshair, { attachTo: true })
                    .opacity(0.8)
                    .locally()
                    .persist()
                .effect()
                    .name("Circle Crosshair")
                    .file(closest(`eskie.crosshair.circle.fantasy_01.white.full.radius_${effectSize}ft`))
                    .attachTo(crosshair)
                    .scaleToObject()
                    .opacity(0.8)
                    .belowTokens()
                    .locally()
                    .persist()
                .play();
        })
        .callback(Sequencer.Crosshair.CALLBACKS.PLACED, function() {
            Sequencer.EffectManager.endEffects({ name: "Circle Crosshair" });
        })
        .callback(Sequencer.Crosshair.CALLBACKS.CANCEL, function() {
            Sequencer.EffectManager.endEffects({ name: "Circle Crosshair" });
        });

if (tintMap && bgSrc) {
    sequence
        .effect()
            .name(`Casting ${token.name}`)
            .file(bgSrc)
            .filter("ColorMatrix", { saturate: 1, brightness: 0.6 })
            .atLocation({ x: canvas.dimensions.width / 2, y: canvas.dimensions.height / 2 })
            .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
            .persist()
            .fadeIn(2000)
            .fadeOut(3000)
            .filter("ColorMatrix", { brightness: 0 })
            .belowTokens()
            .opacity(0.5);
}

sequence
    .sound()
        .file("psfx.3rd-level-spells.fireball.v1.001.beam")
        .volume(1)

    .effect()
        .file(closest("jb2a.fireball.beam.orange"))
        .attachTo(token, { offset: { x: 0.25 + tokenOffset }, gridUnits: true, local: true })
        .stretchTo("position", { attachTo: true })
        .duration(1900)
        .zIndex(1)

    .effect()
        .file(closest("eskie.pulse.energy.03.slow.orange"))
        .attachTo(token, { offset: { x: -0.575 - tokenOffset }, gridUnits: true, local: true })
        .rotateTowards("position", { attachTo: true })
        .scaleToObject(2, { considerTokenScale: true })
        .duration(1900)

    .effect()
        .delay(2000)
        .file(closest("eskie.velocity.02"))
        .atLocation(token)
        .rotateTowards("position")
        .size(6, { gridUnits: true })
        .spriteOffset({ x: -4 + tokenOffset }, { gridUnits: true })
        .spriteScale({ x: 1, y: 1.5 })
        .fadeOut(2000)
        .filter("ColorMatrix", { brightness: 0 })

    .effect()
        .file(closest("eskie.star.twinkling_star.02.orangeyellow"))
        .attachTo(token, { offset: { x: -1 - tokenOffset }, gridUnits: true, local: true })
        .rotateTowards("position")
        .delay(1800)
        .scaleToObject(3, { considerTokenScale: true })
        .playbackRate(1.2)
        .spriteRotation(80)
        .waitUntilFinished(-250)

    .sound()
        .file("blfx.sound.spell.cast.burning_hands")
        .volume(1)

    .effect()
        .file(closest("jb2a.fireball.beam.orange"))
        .atLocation(token, { offset: { x: 0.2 + tokenOffset }, gridUnits: true, local: true })
        .stretchTo("position")
        .startTime(2000)

    .effect()
        .file(closest("jb2a.cast_generic.fire.side01.orange.0"))
        .atLocation(token)
        .rotateTowards("position")
        .size(4.5, { gridUnits: true })
        .startTime(750)

    .wait(400)

    .effect()
        .delay(250)
        .file(closest("eskie.star.03.orange"))
        .atLocation("position")
        .scaleToObject(1, { considerTokenScale: true })
        .zIndex(1)
        .filter("ColorMatrix", { saturate: 1, hue: -5 })
        .spriteRotation(5)
        .waitUntilFinished(-250)

    .canvasPan()
        .shake({ duration: 1000, strength: 3, rotation: false, fadeOut: 1000 })

    .wait(450)

    .sound()
        .file("psfx.3rd-level-spells.fireball.v1.001.explosion")
        .volume(1)

    .effect()
        .file(closest("jb2a.fireball.explosion.orange"))
        .atLocation("position")
        .scaleToObject(1.4, { considerTokenScale: true })
        .scaleIn(0, 500, { ease: "easeOutQuint" })
        .zIndex(2)

    .effect()
        .file(closest("jb2a.smoke.puff.ring.02.dark_black"))
        .atLocation("position")
        .scaleToObject(1.8, { considerTokenScale: true })
        .scaleIn(0, 500, { ease: "easeOutQuint" })
        .opacity(0.5)
        .randomSpriteRotation()
        .filter("ColorMatrix", { brightness: 0 })
        .zIndex(1)

    .effect()
        .file(closest("jb2a.extras.tmfx.outpulse.circle.02.normal"))
        .atLocation("position")
        .scaleToObject(4, { considerTokenScale: true })
        .scaleIn(0, 500, { ease: "easeOutQuint" })
        .opacity(0.25)
        .belowTokens()
        .randomSpriteRotation()
        .filter("ColorMatrix", { brightness: 0 })
        .zIndex(1);

if (scorchedEarth) {
    sequence
        .effect()
            .file(closest("jb2a.ground_cracks.orange.01"))
            .atLocation("position")
            .scaleToObject(0.9, { considerTokenScale: true })
            .randomRotation()
            .fadeOut(2000)
            .duration(5000)
            .belowTokens()
            .delay(2300)
            .persist(persistEffect)
            .zIndex(0.1)

        .effect()
            .file(closest("jb2a.scorched_earth.black"))
            .atLocation("position")
            .scaleToObject(0.8, { considerTokenScale: true })
            .fadeOut(2000)
            .duration(5000)
            .opacity(0.5)
            .belowTokens()
            .delay(2300)
            .persist(persistEffect);
}

sequence.thenDo(function() {
    Sequencer.EffectManager.endEffects({ name: `Casting ${token.name}` });
});

await sequence.play({ preload: true });
