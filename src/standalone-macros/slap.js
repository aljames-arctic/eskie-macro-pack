// Standalone Macro: Emote - Slap
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Slap' macro requires the 'Sequencer' module to be installed and active!");
}

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const target = game.user.targets.first();
let location = target;

if (!location) {
    const crosshairConfig = {
        size: 0.5,
        icon: closest("eskie.crosshair.circle.fantasy_01") ?? "icons/svg/circle.svg",
        label: "Slap Target",
        tag: "Spray",
        drawIcon: false,
        drawOutline: true,
        interval: 0,
        fillAlpha: 0.25,
        fillColor: "#FF0000",
        rememberControlled: true,
        cancelled: false
    };
    location = await Sequencer.Crosshair.show(crosshairConfig);
    if (!location || location.cancelled) return;
}

const id = "slap";
const slapEffect = new Sequence();

slapEffect.effect()
    .name(id)
    .atLocation(location, { offset: { x: 0.1, y: -0.1 }, gridUnits: true })
    .file(closest("eskie.sound.roar"))
    .size(1.7, { gridUnits: true });

slapEffect.effect()
    .name(id)
    .atLocation(location)
    .file("https://i.imgur.com/9tLjNHH.png")
    .size(0.55, { gridUnits: true })
    .rotate(-45)
    .fadeOut(250)
    .duration(1000)
    .delay(50)
    .zIndex(1);

slapEffect.effect()
    .name(id)
    .atLocation(location)
    .file("https://i.imgur.com/9tLjNHH.png")
    .filter("ColorMatrix", { brightness: -1 })
    .opacity(0.5)
    .duration(5000)
    .fadeOut(1000)
    .rotate(-45)
    .size(0.55, { gridUnits: true })
    .delay(50)
    .zIndex(0);

await slapEffect.play();
