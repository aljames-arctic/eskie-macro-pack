// Standalone Macro: Cloudkill
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Cloudkill' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const label = `Cloudkill ${token.name}`;
const isPlaying = Sequencer.EffectManager.getEffects({ name: label }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label });
    Sequencer.EffectManager.endEffects({ name: `Casting ${token.name}` });
    return ui.notifications.info(`Ended Cloudkill for ${token.name}.`);
}

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const radius = 20;
const AVAILABLE_SIZES = [10, 20, 30, 60];
const effectSize = AVAILABLE_SIZES.reduce((acc, size) => (size <= radius ? size : acc), AVAILABLE_SIZES[0]);

const bgSrc = globalThis.eskie?.util?.adapter?.getSceneBackground?.(canvas.scene)?.src
    ?? canvas.scene?.background?.src
    ?? "";

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
                .wait(50)
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

if (bgSrc) {
    sequence
        .effect()
            .name(`Casting ${token.name}`)
            .file(bgSrc)
            .atLocation({ x: canvas.dimensions.width / 2, y: canvas.dimensions.height / 2 })
            .size({ width: canvas.scene.width / canvas.grid.size, height: canvas.scene.height / canvas.grid.size }, { gridUnits: true })
            .persist()
            .fadeIn(1000, { ease: "easeOutCubic" })
            .fadeOut(3000)
            .filter("ColorMatrix", { brightness: 0 })
            .belowTokens()
            .opacity(0.5);
}

sequence
    .effect()
        .file(closest("eskie.smoke.07.green"))
        .atLocation("position")
        .scaleIn(0, 500, { ease: "easeOutCubic" })
        .scaleToObject(1.5, { considerTokenScale: true })
        .opacity(0.1)

    .effect()
        .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
        .atLocation("position")
        .scaleToObject(0.75, { considerTokenScale: true })
        .fadeIn(250)
        .fadeOut(750, { ease: "easeOutCubic" })
        .duration(2100)
        .opacity(0.1)
        .belowTokens()
        .tint("#94d123")
        .randomRotation()

    .effect()
        .file(closest("eskie.star.03.green"))
        .atLocation("position")
        .size({ width: 2.5, height: 2.5 }, { gridUnits: true })

    .wait(500)

    .effect()
        .file(closest("eskie.poison.circle.01.green"))
        .atLocation("position")
        .scaleToObject(1.1, { considerTokenScale: true })

    .effect()
        .name(label)
        .file(closest("jb2a.fog_cloud.02.green"))
        .atLocation("position")
        .scaleToObject(1, { considerTokenScale: true })
        .opacity(0.35)
        .fadeIn(3000)
        .scaleIn(0.25, 2500, { ease: "easeOutSine" })
        .persist()
        .zIndex(1)

    .wait(5000)

    .thenDo(function() {
        Sequencer.EffectManager.endEffects({ name: `Casting ${token.name}` });
    });

await sequence.play({ preload: true });
