// Standalone Macro: Piercing Arrow
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Piercing Arrow' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const crosshairConfig = {
    t: "ray",
    distance: 30,
    width: 5,
    icon: { texture: token.document?.texture?.src ?? "" },
    gridHighlight: false,
    borderAlpha: 0,
    location: { obj: token, lockToEdge: true },
};

const crosshairCallbacks = {
    [Sequencer.Crosshair.CALLBACKS.SHOW]: (crosshair) => {
        new Sequence()
            .wait(50)
            .effect()
                .name("Ray Crosshair")
                .file(closest("eskie.crosshair.ray.fantasy_01.white.full"))
                .attachTo(crosshair)
                .stretchTo(crosshair, { attachTo: true, onlyX: true })
                .scale(((canvas?.grid?.size ?? 100) / 300) * 0.8)
                .locally()
                .persist()
            .play();
    },
    [Sequencer.Crosshair.CALLBACKS.PLACED]: () => {
        Sequencer.EffectManager.endEffects({ name: "Ray Crosshair" });
    },
    [Sequencer.Crosshair.CALLBACKS.CANCEL]: () => {
        Sequencer.EffectManager.endEffects({ name: "Ray Crosshair" });
    },
};

const position = await Sequencer.Crosshair.show(crosshairConfig, crosshairCallbacks);
if (!position || position.cancelled) return;

const tokenWidth = token.document?.width ?? token.width ?? 1;

const sequence = new Sequence();

sequence
    .effect()
        .file(closest("eskie.velocity.02.white"))
        .atLocation(token)
        .rotateTowards(position)
        .size(tokenWidth * 2, { gridUnits: true })
        .spriteOffset({ x: -1 }, { gridUnits: true })
        .tint("#ecc432")
        .opacity(0.85)
        .fadeIn(500)

    .effect()
        .file(closest("jb2a.energy_strands.in.green.01"))
        .atLocation(token)
        .rotateTowards(position)
        .size(tokenWidth * 2, { gridUnits: true })
        .spriteScale({ x: 0.75 })
        .spriteOffset({ x: -0.3 }, { gridUnits: true })
        .playbackRate(1.5)
        .waitUntilFinished()

    .effect()
        .file(closest("eskie.star.02.yellow"))
        .atLocation(token)
        .rotateTowards(position)
        .scaleToObject(1, { considerTokenScale: true })
        .spriteOffset({ x: -0.1 }, { gridUnits: true })

    .wait(250)

    .effect()
        .file(closest("eskie.attack.ranged.arrow.ray.physical.green"))
        .atLocation(token)
        .stretchTo(position)
        .scale(2)
        .zIndex(2);

const hitTargets = Array.from(game.user.targets);
for (let i = 0; i < hitTargets.length; i++) {
    const t = hitTargets[i];
    const targetSeq = new Sequence()
        .wait(1 + i * 50)
        .effect()
            .copySprite(t)
            .attachTo(t)
            .scaleToObject(1, { considerTokenScale: true })
            .loopProperty("sprite", "position.x", { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
            .opacity(0.5)
            .duration(1000)
            .fadeOut(250)
        .effect()
            .file(closest("eskie.damage.piercing.01.yellow"))
            .attachTo(t, { bindAlpha: false, bindVisibility: false })
            .scaleToObject(1.5, { considerTokenScale: true })
            .zIndex(1);

    sequence.addSequence(targetSeq);
}

await sequence.play();
