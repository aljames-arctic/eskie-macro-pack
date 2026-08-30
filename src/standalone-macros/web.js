// Standalone Macro: Web
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Web' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const label = `${token.name} Web`;
const isPlaying = Sequencer.EffectManager.getEffects({ name: label }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label });
    Sequencer.EffectManager.endEffects({ name: `${label} Casting` });
    return ui.notifications.info(`Ended Web for ${token.name}.`);
}

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const distance = 28.5;

const targetPos = await Sequencer.Crosshair.show({
    type: "rect",
    distance,
    icon: token.document?.texture?.src ?? "",
    label: "Web",
    snapPosition: 240
});
if (!targetPos || targetPos.cancelled) return;

const sequence = new Sequence();

sequence
    .effect()
        .name(`${label} Casting`)
        .file(closest("eskie.casting.arcane.01.side.loop.yellow"))
        .attachTo(token)
        .rotateTowards(targetPos)
        .scaleToObject(1.25, { considerTokenScale: true })
        .spriteOffset({ x: -0.15 }, { gridUnits: true })
        .persist()

    .effect()
        .name(`${label} Casting`)
        .file(closest("eskie.casting.arcane.01.center.loop.yellow"))
        .atLocation(targetPos)
        .size(1.75, { gridUnits: true })
        .belowTokens()
        .zIndex(1.1)
        .persist()

    .effect()
        .name(label)
        .atLocation(targetPos)
        .file(closest("jb2a.magic_signs.circle.02.conjuration.complete.dark_yellow"))
        .size(3.5, { gridUnits: true })
        .fadeIn(600)
        .opacity(1)
        .rotateIn(180, 600, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeOutCubic" })
        .belowTokens()
        .fadeOut(500)
        .duration(3000)

    .effect()
        .name(label)
        .atLocation(targetPos)
        .file(closest("jb2a.magic_signs.circle.02.conjuration.complete.dark_yellow"))
        .size(3.5, { gridUnits: true })
        .fadeIn(600, { delay: 2500 })
        .fadeOut(1000)
        .opacity(0.5)
        .rotateIn(180, 600, { ease: "easeOutCubic" })
        .scaleIn(0, 600, { ease: "easeOutCubic" })
        .persist()
        .belowTokens()
        .filter("ColorMatrix", { brightness: 0 })

    .effect()
        .file(closest("jb2a.markers.light_orb.loop.white"))
        .atLocation(targetPos)
        .scaleIn(0, 1500, { ease: "easeOutCubic" })
        .fadeIn(500)
        .duration(2500)
        .belowTokens()
        .zIndex(2)
        .size(2, { gridUnits: true })

    .effect()
        .file(closest("jb2a.shield_themed.above.eldritch_web.01.dark_green"))
        .atLocation(targetPos)
        .scaleIn(0, 1500, { ease: "easeOutCubic" })
        .fadeIn(500)
        .duration(2500)
        .belowTokens()
        .zIndex(2.1)
        .size(0.9, { gridUnits: true })
        .opacity(0.5)
        .filter("ColorMatrix", { brightness: 0, saturate: -1 })

    .wait(2250)

    .effect()
        .delay(250)
        .file(closest("jb2a.impact.004.yellow"))
        .atLocation(targetPos)
        .scaleToObject(0.8, { considerTokenScale: true })
        .scaleIn(0, 200, { ease: "easeOutCubic" })
        .filter("ColorMatrix", { saturate: -1 })

    .thenDo(() => {
        Sequencer.EffectManager.endEffects({ name: `${label} Casting` });
    })

    .effect()
        .name(label)
        .file(closest("blfx.spell.template.square.nature.web.1.color1"))
        .atLocation(targetPos)
        .scaleToObject(1, { considerTokenScale: true })
        .persist()
        .zIndex(1)

    .effect()
        .name(label)
        .file(closest("blfx.spell.template.square.nature.web.2.color1"))
        .atLocation(targetPos)
        .scaleToObject(1, { considerTokenScale: true })
        .persist()
        .opacity(0.5)
        .zIndex(1)
        .belowTokens();

await sequence.play();
