// Standalone Macro: Roman Candle
// Original Author: Unknown
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Roman Candle' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select your shooter token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const crosshairConfig = {
    size: 2,
    icon: "icons/magic/fire/projectile-meteor-salvo-heavy-blue.webp",
    label: "Roman Candle Target Area",
    drawIcon: true,
    drawOutline: true,
    interval: 0,
    rememberControlled: true
};

const position = await Sequencer.Crosshair.show(crosshairConfig);
if (!position || position.cancelled) return;

const items = Sequencer.Database.getPathsUnder("jb2a.bolt.fire") ?? ["orange", "red", "blue"];
const shots = 3;
let seq = new Sequence();

seq.effect()
    .file(closest("jb2a.impact.005.white"))
    .scale(0.5)
    .atLocation(token)
    .anchor({ x: 0.42 })
    .rotateTowards(position)
    .animateProperty("sprite", "rotation", { from: -45, to: -45, duration: 10 })
    .zIndex(2)
    .duration(10000)
    .belowTokens()
    .playbackRate(2)
    .attachTo(token, { bindVisibility: false });

seq.effect()
    .file(closest("jb2a.impact.005.yellow"))
    .scale(0.5)
    .atLocation(token)
    .anchor({ x: 0.42 })
    .rotateTowards(position)
    .animateProperty("sprite", "rotation", { from: -45, to: -45, duration: 10 })
    .zIndex(2)
    .delay(250)
    .duration(10000)
    .belowTokens()
    .playbackRate(2)
    .attachTo(token, { bindVisibility: false });

for (let i = 0; i < shots; i++) {
    const effectColor = items[Math.floor(Math.random() * items.length)] ?? "orange";

    seq.effect()
        .file(closest(`jb2a.impact.005.${effectColor}`))
        .scale(0.5)
        .atLocation(token)
        .anchor({ x: 0.42 })
        .rotateTowards(position)
        .animateProperty("sprite", "rotation", { from: -45, to: -45, duration: 10 })
        .delay(500)
        .duration(10000)
        .belowTokens()
        .playbackRate(2)
        .attachTo(token, { bindVisibility: false });

    seq.effect()
        .file(closest("jb2a.bolt.physical.white"))
        .scale(2)
        .atLocation(token)
        .stretchTo(position)
        .loopProperty("spriteContainer", "position.y", { from: -25, to: 25, duration: 1000, pingPong: true })
        .filter("ColorMatrix", { saturate: -1, brightness: 1 })
        .zIndex(2)
        .filter("Blur", { blurX: 5, blurY: 10 })
        .startTime(1000)
        .delay(1000);

    seq.effect()
        .file(closest(`jb2a.bolt.fire.${effectColor}`))
        .atLocation(token)
        .scale(2)
        .loopProperty("spriteContainer", "position.y", { from: -25, to: 25, duration: 1000, pingPong: true })
        .stretchTo(position)
        .startTime(1000)
        .delay(1000)
        .waitUntilFinished();
}

await seq.play();
