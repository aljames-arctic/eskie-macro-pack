// Standalone Macro: Cloud of Sand
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Cloud of Sand' macro requires the 'Sequencer' module to be installed and active!");
}

const closest = (path) => globalThis.eskie?.util?.file?.closest?.(path)
    ?? globalThis.game?.modules?.get('eskie-macros')?.api?.util?.closest?.(path)
    ?? path;

const label = "Cloud of Sand";

// Toggle handling: if persistent cloud effects are already present at selected location / canvas
const activeEffects = Sequencer.EffectManager.getEffects({ name: label });
if ((activeEffects?.length ?? 0) > 0) {
    Sequencer.EffectManager.endEffects({ name: label });
    return ui.notifications.info("Cleared active Cloud of Sand.");
}

const color = "white";
const configWarpgate = {
    size: 9,
    icon: "icons/magic/air/air-wave-gust-smoke-yellow.webp",
    label: "Cloud of Sand Area",
    tag: "entangle",
    t: "circle",
    drawIcon: true,
    drawOutline: true,
    interval: 2,
    rememberControlled: true,
};

const position = await Sequencer.Crosshair.show(configWarpgate);
if (!position || position.cancelled) return;

function createCloudEffect(pos, file, { size, opacity, rotate, zIndex, rotationDuration }, persist) {
    return new Sequence()
        .effect()
        .name(label)
        .file(closest(file))
        .atLocation(pos)
        .size(size, { gridUnits: true })
        .scaleIn(0, 1000, { ease: "easeInCubic" })
        .rotateIn(-900, 1000, { ease: "easeOutCubic" })
        .fadeIn(500)
        .filter("ColorMatrix", { hue: -25 })
        .belowTokens()
        .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: rotationDuration })
        .persist(persist)
        .opacity(opacity)
        .rotate(rotate)
        .zIndex(zIndex)
        .rotateOut(360, 500, { ease: "easeOutCubic", delay: 250 })
        .scaleOut(1, 500, { ease: "easeOutCubic", delay: 250 })
        .fadeOut(750);
}

const persist = true;
const sequence = new Sequence();

sequence.effect()
    .name(label)
    .file(closest("jb2a.extras.tmfx.outflow.circle.04"))
    .atLocation(position)
    .size(10, { gridUnits: true })
    .fadeIn(1000, { ease: "easeInCubic" })
    .fadeOut(1500)
    .filter("ColorMatrix", { saturate: -0.25, brightness: 1.15, hue: -30 })
    .tint("#faff1e")
    .belowTokens()
    .opacity(0.45)
    .duration(7500);

sequence.effect()
    .name(label)
    .file(closest(`jb2a.sleep.cloud.01.${color}`))
    .atLocation(position)
    .size(10, { gridUnits: true })
    .fadeIn(1000, { ease: "easeInCubic" })
    .filter("ColorMatrix", { hue: -25 })
    .belowTokens()
    .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 1500 })
    .fadeOut(1500)
    .duration(7500);

sequence.wait(500);

sequence.effect()
    .delay(750)
    .file(closest("eskie.smoke.07.white"))
    .atLocation(position, { offset: { y: -0.25 }, gridUnits: true })
    .size(10, { gridUnits: true })
    .scaleIn(0, 250, { ease: "easeInCirc" })
    .fadeOut(500)
    .filter("ColorMatrix", { saturate: -0.5, brightness: 1.35, hue: -40 })
    .opacity(0.45)
    .duration(1000)
    .mirrorX()
    .tint("#faff1e")
    .belowTokens();

sequence.effect()
    .name(label)
    .file(closest("jb2a.extras.tmfx.outflow.circle.04"))
    .atLocation(position)
    .size(12, { gridUnits: true })
    .fadeIn(1000, { ease: "easeInCubic" })
    .fadeIn(500)
    .filter("ColorMatrix", { saturate: -0.25, brightness: 1.15, hue: -30 })
    .tint("#faff1e")
    .belowTokens()
    .opacity(0.45)
    .persist(persist);

sequence.addSequence(createCloudEffect(position, `jb2a.sleep.cloud.01.${color}`, { size: 12, opacity: 1, rotate: 0, zIndex: 1, rotationDuration: 1500 }, persist));
sequence.addSequence(createCloudEffect(position, `jb2a.sleep.cloud.01.${color}`, { size: 10, opacity: 0.65, rotate: 90, zIndex: 2, rotationDuration: 1400 }, persist));
sequence.addSequence(createCloudEffect(position, `jb2a.sleep.cloud.01.${color}`, { size: 6, opacity: 0.4, rotate: 180, zIndex: 3, rotationDuration: 1300 }, persist));
sequence.addSequence(createCloudEffect(position, `jb2a.sleep.cloud.01.${color}`, { size: 2, opacity: 0.25, rotate: 180, zIndex: 4, rotationDuration: 1200 }, persist));
sequence.addSequence(createCloudEffect(position, `jb2a.sleep.cloud.01.${color}`, { size: 1, opacity: 0.15, rotate: 180, zIndex: 5, rotationDuration: 1100 }, persist));

await sequence.play();
