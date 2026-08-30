// Standalone Macro: Burning Hands
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Burning Hands' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const angle = 53.13;
const coneSize = "thin";
const distance = 15;

const tokenWidth = token.document?.width ?? token.width ?? 1;
const tokenOffset = (tokenWidth - 1) / 2;

const targetPos = await Sequencer.Crosshair.show({
    type: "cone",
    distance,
    angle,
    icon: token.document?.texture?.src ?? "",
    label: "Burning Hands",
    location: { obj: token, lockToEdge: true, lockToEdgeDirection: true }
});
if (!targetPos || targetPos.cancelled) return;

const sequence = new Sequence();

sequence
    .effect()
        .file(closest("jb2a.energy_strands.in.yellow.01"))
        .attachTo(token)
        .rotateTowards(targetPos, { attachTo: true })
        .size(1, { gridUnits: true })
        .spriteScale({ x: 0.75, y: 1.25 })
        .spriteOffset({ x: 0.1 + tokenOffset }, { gridUnits: true })
        .playbackRate(1.5)
        .filter("ColorMatrix", { saturate: 0.5, hue: 0 })
        .waitUntilFinished(-350)

    .effect()
        .file(closest("jb2a.template_line_piercing.generic.01.orange"))
        .attachTo(token)
        .rotateTowards(targetPos, { attachTo: true })
        .size({ width: 1, height: 0.25 }, { gridUnits: true })
        .spriteOffset({ x: 0.35 + tokenOffset, y: 0 }, { gridUnits: true })
        .spriteScale({ x: 1.25 })
        .filter("ColorMatrix", { saturate: 0.5, hue: 10 })
        .spriteRotation(-180)
        .zIndex(1)
        .waitUntilFinished()

    .effect()
        .file(closest("jb2a.impact.010.orange"))
        .attachTo(token)
        .rotateTowards(targetPos)
        .size(1, { gridUnits: true })
        .spriteScale({ x: 0.75, y: 1.25 })
        .spriteOffset({ x: 0.1 + tokenOffset }, { gridUnits: true })
        .playbackRate(1.5)
        .filter("ColorMatrix", { saturate: 0.5, hue: 0 })

    .effect()
        .file(closest("eskie.star.03.orange"))
        .attachTo(token)
        .rotateTowards(targetPos)
        .size(2.5, { gridUnits: true })
        .spriteOffset({ x: -0.8 + tokenOffset }, { gridUnits: true })
        .spriteRotation(90)
        .playbackRate(1.5)
        .filter("ColorMatrix", { saturate: 0.5, hue: 0 })
        .zIndex(2)

    .effect()
        .file(closest("eskie.particle.02.orange"))
        .attachTo(token)
        .rotateTowards(targetPos, { attachTo: true })
        .spriteOffset({ x: -0.9 + tokenOffset }, { gridUnits: true })
        .size(1.5, { gridUnits: true })
        .fadeIn(250)
        .fadeOut(500)
        .zIndex(1)

    .effect()
        .name(`${token.name} Burning Hands`)
        .file(closest("eskie.smoke.04.black"))
        .attachTo(token)
        .rotateTowards(targetPos, { attachTo: true })
        .spriteOffset({ x: -1.55 + tokenOffset }, { gridUnits: true })
        .size(2.5, { gridUnits: true })
        .opacity(0.8)
        .persist()

    .effect()
        .file(closest("jb2a.burning_hands.02.orange"))
        .attachTo(token, { offset: { x: 0.35 + tokenOffset }, gridUnits: true, local: true })
        .stretchTo(targetPos, { attachTo: true })
        .zIndex(1)
        .waitUntilFinished(-1400)

    .thenDo(function() {
        Sequencer.EffectManager.endEffects({ name: `${token.name} Burning Hands`, object: token });
    });

await sequence.play({ preload: true });
