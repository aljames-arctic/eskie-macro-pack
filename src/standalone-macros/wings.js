// Standalone Macro: Wings
// Original Author: .eskie & bakanabaka
// Modular Standalone Conversion

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Wings' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

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

const id = "wings";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id} - ${tokenId}`;

// Toggle / re-entrant persistent effect handling
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
const wildcardEffects = Sequencer.EffectManager.getEffects({ name: `${id}*`, object: token });
if ((activeEffects?.length ?? 0) > 0 || (wildcardEffects?.length ?? 0) > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: `${id}*`, object: token });
    await new Sequence()
        .animation()
            .on(token)
            .opacity(1)
        .play();
    return ui.notifications.info(`Stopped Wings effect on ${token.name}.`);
}

// Dialog options for Wing Type (angelic, celestial, demon, dragon)
const wingType = await Dialog.wait({
    title: "Wings Macro - Select Wing Type",
    content: `
        <form style="padding: 6px;">
            <div style="font-weight: bold; margin-bottom: 10px; text-align: center; font-size: 1.1em;">Choose Wing Type:</div>
        </form>
    `,
    buttons: {
        angelic: {
            icon: '<i class="fas fa-feather-alt" style="color: #f0f8ff;"></i>',
            label: "Angelic (White)",
            callback: () => "angelic"
        },
        celestial: {
            icon: '<i class="fas fa-sun" style="color: #ffd700;"></i>',
            label: "Celestial (Golden)",
            callback: () => "celestial"
        },
        demon: {
            icon: '<i class="fas fa-fire-flame-curved" style="color: #ff3300;"></i>',
            label: "Demon (Fiery)",
            callback: () => "demon"
        },
        dragon: {
            icon: '<i class="fas fa-dragon" style="color: #9b59b6;"></i>',
            label: "Dragon (Draconic)",
            callback: () => "dragon"
        }
    },
    default: "angelic",
    close: () => null
});

if (!wingType) return;

// Wing configuration presets
const WING_CONFIGS = {
    angelic: {
        image: "eskie.wings",
        hue: 0,
        brightness: 0.3,
        saturate: -0.3,
        wingSize: 1.1,
        speedMulti: 1.0,
        swayMulti: 1.0,
        introParticle: "jb2a.sparkles.orange.01",
        introHue: 180,
        tint: null
    },
    celestial: {
        image: "eskie.wings",
        hue: 45,
        brightness: 0.2,
        saturate: 0.6,
        wingSize: 1.15,
        speedMulti: 0.9,
        swayMulti: 1.2,
        introParticle: "jb2a.stars.interactive.01.yellow",
        introHue: 45,
        tint: "#ffe875"
    },
    demon: {
        image: "eskie.wings",
        hue: -35,
        brightness: 0.25,
        saturate: 0.9,
        wingSize: 1.25,
        speedMulti: 1.35,
        swayMulti: 1.1,
        introParticle: "jb2a.impact.010.orange",
        introHue: 0,
        tint: "#ff2200"
    },
    dragon: {
        image: "eskie.wings",
        hue: -80,
        brightness: -0.05,
        saturate: 0.7,
        wingSize: 1.35,
        speedMulti: 0.8,
        swayMulti: 1.3,
        introParticle: "jb2a.wind_stream.white",
        introHue: 0,
        tint: "#8b0000"
    }
};

const cfg = WING_CONFIGS[wingType] ?? WING_CONFIGS.angelic;
const { image, hue, brightness, saturate, wingSize, speedMulti, swayMulti, introParticle, introHue, tint } = cfg;

const rotation = token.document?.rotation ?? token.rotation ?? 0;
const offset = { x: 0, y: 0 };

const sequence = new Sequence();

// Initial attach burst particle
if (introParticle) {
    let introFx = sequence.effect()
        .file(closest(introParticle))
        .atLocation(token)
        .scaleToObject(2)
        .opacity(0.8);
    if (introHue) introFx.filter("ColorMatrix", { hue: introHue });
}

// 1. Hide original token sprite while hovering altitude scale effect is active
sequence.animation()
    .on(token)
    .opacity(0);

// 2. Ground drop shadow beneath token
sequence.effect()
    .name(label)
    .copySprite(token)
    .rotate(rotation)
    .spriteRotation(rotation)
    .attachTo(token, { bindAlpha: false })
    .scaleToObject(0.8, { considerTokenScale: true })
    .zIndex(0.1)
    .persist()
    .belowTokens()
    .filter("ColorMatrix", { brightness: -1 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .opacity(0.65);

// 3. Hover altitude body scale animation (swaying floating token body)
sequence.effect()
    .name(label)
    .copySprite(token)
    .rotate(rotation)
    .spriteRotation(rotation)
    .attachTo(token, { offset: { y: -0.5 - (0.1 * swayMulti) }, gridUnits: true, bindAlpha: false })
    .scaleToObject(1, { considerTokenScale: true })
    .zIndex(0.2)
    .persist()
    .animateProperty('spriteContainer', 'position.y', { from: 0.5 + (0.1 * swayMulti), to: 0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
    .loopProperty('spriteContainer', 'position.y', { values: [0.075 * swayMulti, 0.1 * swayMulti, 0.025 * swayMulti, 0, 0.025 * swayMulti, 0.05 * swayMulti], duration: (3000 / speedMulti) / 6, gridUnits: true, ease: "linear", pingPong: true });

// 4. Wings attachment on token sides with flapping animation loop & color profile
let wingsEffect = sequence.effect()
    .name(label)
    .file(closest(image))
    .attachTo(token, { offset: { y: offset.y - 0.5 - (0.1 * swayMulti), x: offset.x }, gridUnits: true, bindAlpha: false })
    .scaleToObject(3 * wingSize)
    .zIndex(0.15)
    .persist()
    .animateProperty('spriteContainer', 'position.y', { from: 0.5 + (0.1 * swayMulti), to: 0, duration: 1000, gridUnits: true, ease: "easeOutBack" })
    .loopProperty('spriteContainer', 'position.y', { values: [0.075 * swayMulti, 0.1 * swayMulti, 0.025 * swayMulti, 0, 0.025 * swayMulti, 0.05 * swayMulti], duration: (3000 / speedMulti) / 6, gridUnits: true, ease: "linear", pingPong: true })
    .playbackRate(speedMulti)
    .filter("ColorMatrix", { hue: hue, brightness: brightness, saturate: saturate });

if (tint) {
    wingsEffect.tint(tint);
}

await sequence.play();
