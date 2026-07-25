// Standalone Macro: Sandevistan Cybernetic Speed Trail
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Sandevistan' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select your Cyberpunk / Monk token!");

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

const id = "Sandevistan";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id} - ${tokenId}`;

// Toggle off if active
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token }) ?? [];
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: `${label} - Trail` });
    if (typeof FXMASTER !== "undefined") {
        FXMASTER.filters.switch("SandyfilterID", "color", {
            color: { value: "#ffffff", apply: false },
        });
    }
    return ui.notifications.info("Deactivated Sandevistan overdrive system.");
}

const hslToHex = (h, s, l) => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        let hex = Math.round(255 * color).toString(16);
        if (hex.length < 2) hex = "0" + hex;
        return hex;
    };
    return `#${f(0)}${f(8)}${f(4)}`;
};

const sequence = new Sequence();

sequence.thenDo(async () => {
    if (typeof FXMASTER !== "undefined") {
        await FXMASTER.filters.switch("SandyfilterID", "color", {
            color: { value: "#76feb1", apply: true },
            saturation: 0.9,
            contrast: 1.3,
            brightness: 1.1,
            gamma: 0.9,
            skipFading: true,
        });
    }
});

sequence.effect()
    .name(label)
    .atLocation(token)
    .file(closest("jb2a.token_stage.round.green.02.02"))
    .scaleToObject(1.2)
    .filter("ColorMatrix", { hue: 50 })
    .playbackRate(2)
    .duration(4000)
    .attachTo(token)
    .aboveLighting()
    .persist()
    .zIndex(2);

sequence.effect()
    .delay(250)
    .name(label)
    .atLocation(token)
    .file(closest("jb2a.token_stage.round.green.02.02"))
    .scaleToObject(1.2)
    .filter("ColorMatrix", { hue: 25 })
    .filter("Blur", { blurX: 30, blurY: 0 })
    .aboveLighting()
    .attachTo(token)
    .duration(3750)
    .playbackRate(2)
    .persist()
    .zIndex(1);

// Generate 12 rainbow hue-shifting speed phantom echo clones of the token
const msPerImage = 120;
const repeats = 14;
const tokenRotation = token.document?.rotation ?? token.rotation ?? 0;

for (let i = 0; i < repeats; i++) {
    const hue = (22.5 * i) % 360;
    const color = hslToHex(hue, 100, 50);

    sequence.effect()
        .atLocation(token)
        .name(`${label} - Trail`)
        .duration(2800)
        .delay(msPerImage * i)
        .copySprite(token)
        .spriteRotation(-tokenRotation)
        .scaleToObject(1, { considerTokenScale: true })
        .belowTokens()
        .opacity(0.85)
        .tint(color)
        .extraEndDuration(500)
        .zIndex(0);
}

await sequence.play();
