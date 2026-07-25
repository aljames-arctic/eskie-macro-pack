// Standalone Macro: Dash / Cunning Action
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Dash' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select your token!");

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

const id = "Cunning Action";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id} - ${tokenId}`;

const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: `${label} - Trail` });
    return ui.notifications.info("Ended Dash sprint speed stance.");
}

const sequence = new Sequence();

sequence.effect()
    .name(label)
    .file(closest("eskie.smoke.03.black"))
    .attachTo(token)
    .scaleToObject(2)
    .belowTokens()
    .opacity(0.5)
    .tint("#696969");

sequence.effect()
    .name(label)
    .file(closest("eskie.buff.one_shot.simple.blue"))
    .attachTo(token)
    .scaleToObject(1)
    .filter("ColorMatrix", { saturate: -1, brightness: 2 })
    .opacity(1);

sequence.wait(200);

sequence.effect()
    .name(label)
    .file(closest("jb2a.wind_stream.200.white"))
    .attachTo(token)
    .scaleToObject(1.15, { considerTokenScale: true })
    .fadeIn(500)
    .fadeOut(500)
    .mask()
    .playbackRate(1.5)
    .rotate(90)
    .persist()
    .opacity(0.5);

sequence.effect()
    .name(`${label} - Trail`)
    .file(closest("eskie.trail.token.generic.02.black"))
    .attachTo(token)
    .scaleToObject(1.5, { considerTokenScale: true })
    .spriteOffset({ x: -(1.5 * (token.document?.width ?? 1)) }, { gridUnits: true })
    .opacity(1)
    .persist()
    .timeRange(250, 750)
    .fadeOut(500, { ease: "easeOutQuint" })
    .filter("ColorMatrix", { saturate: 3 });

await sequence.play();
