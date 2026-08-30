// Standalone Macro: Fireball
// Original Author: .eskie
// Editor: Papa Nurgle
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Fireball' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const radius = 20;
const scorchedEarth = true;
const persistEffect = false;
const tintMap = true;

const targetPos = await Sequencer.Crosshair.show({
    type: "circle",
    distance: radius,
    icon: token.document?.texture?.src ?? "",
    label: "Fireball"
});
if (!targetPos || targetPos.cancelled) return;
const tokenWidth = token.document?.width ?? token.width ?? 1;
const tokenOffset = (tokenWidth - 1) / 2;

const bgSrc = globalThis.eskie?.util?.adapter?.getSceneBackground?.(canvas.scene)?.src
    ?? canvas.scene?.background?.src
    ?? "";

const sequence = new Sequence();

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
        .stretchTo(targetPos, { attachTo: true })
        .duration(1900)
        .zIndex(1)

    .effect()
        .file(closest("eskie.pulse.energy.03.slow.orange"))
        .attachTo(token, { offset: { x: -0.575 - tokenOffset }, gridUnits: true, local: true })
        .rotateTowards(targetPos, { attachTo: true })
        .scaleToObject(2, { considerTokenScale: true })
        .duration(1900)

    .effect()
        .delay(2000)
        .file(closest("eskie.velocity.02"))
        .atLocation(token)
        .rotateTowards(targetPos)
        .size(6, { gridUnits: true })
        .spriteOffset({ x: -4 + tokenOffset }, { gridUnits: true })
        .spriteScale({ x: 1, y: 1.5 })
        .fadeOut(2000)
        .filter("ColorMatrix", { brightness: 0 })

    .effect()
        .file(closest("eskie.star.twinkling_star.02.orangeyellow"))
        .attachTo(token, { offset: { x: -1 - tokenOffset }, gridUnits: true, local: true })
        .rotateTowards(targetPos)
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
        .stretchTo(targetPos)
        .startTime(2000)

    .effect()
        .file(closest("jb2a.cast_generic.fire.side01.orange.0"))
        .atLocation(token)
        .rotateTowards(targetPos)
        .size(4.5, { gridUnits: true })
        .startTime(750)

    .wait(400)

    .effect()
        .delay(250)
        .file(closest("eskie.star.03.orange"))
        .atLocation(targetPos)
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
        .atLocation(targetPos)
        .scaleToObject(1.4, { considerTokenScale: true })
        .scaleIn(0, 500, { ease: "easeOutQuint" })
        .zIndex(2)

    .effect()
        .file(closest("jb2a.smoke.puff.ring.02.dark_black"))
        .atLocation(targetPos)
        .scaleToObject(1.8, { considerTokenScale: true })
        .scaleIn(0, 500, { ease: "easeOutQuint" })
        .opacity(0.5)
        .randomSpriteRotation()
        .filter("ColorMatrix", { brightness: 0 })
        .zIndex(1)

    .effect()
        .file(closest("jb2a.extras.tmfx.outpulse.circle.02.normal"))
        .atLocation(targetPos)
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
            .atLocation(targetPos)
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
            .atLocation(targetPos)
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
