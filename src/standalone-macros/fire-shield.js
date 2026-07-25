// Standalone Macro: Fire Shield
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Fire Shield' macro requires the 'Sequencer' module to be installed and active!");
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

const id = "FireShield";
const tokenId = token.id ?? token.document?.id ?? "";
const label = `${id} - ${tokenId}`;

// Toggle / re-entrant persistent effect handling
const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
const wildcardEffects = Sequencer.EffectManager.getEffects({ name: `${id}*`, object: token });
if ((activeEffects?.length ?? 0) > 0 || (wildcardEffects?.length ?? 0) > 0) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: `${id}*`, object: token });
    return;
}

// Prompt for Warm Shield (orange flame) or Cold Shield (blue flame)
const choice = await Dialog.wait({
    title: "Fire Shield",
    content: "<p style='text-align: center;'>Choose Fire Shield option:</p>",
    buttons: {
        warm: {
            icon: '<i class="fas fa-fire" style="color: #ff5500;"></i>',
            label: "Warm Shield (Orange)",
            callback: () => "warm"
        },
        cold: {
            icon: '<i class="fas fa-snowflake" style="color: #00aaff;"></i>',
            label: "Cold Shield (Blue)",
            callback: () => "cold"
        }
    },
    default: "warm",
    close: () => null
});

if (!choice) return;

const isWarm = choice === "warm";
const variant = isWarm ? "orange" : "blue";
const strandsColor = isWarm ? "yellow" : "blue";

const sequence = new Sequence();

// 1. Ground crack impact
sequence.effect()
    .file(closest(`jb2a.impact.ground_crack.${variant}.01`))
    .atLocation(token)
    .belowTokens()
    .scaleToObject(3);

// 2. Outward flare particles
sequence.effect()
    .file(closest(`jb2a.particles.outward.${variant}.01.03`))
    .atLocation(token)
    .delay(200)
    .scaleIn(0.5, 250)
    .fadeOut(3000)
    .duration(15000)
    .scaleToObject(2.75)
    .playbackRate(1)
    .zIndex(2)
    .name(label);

// 3. Inward converging energy strands
sequence.effect()
    .file(closest(`jb2a.energy_strands.in.${strandsColor}.01.2`))
    .atLocation(token)
    .delay(200)
    .scaleIn(0.5, 250)
    .duration(2000)
    .belowTokens()
    .scaleToObject(2.75)
    .playbackRate(1)
    .zIndex(1)
    .name(label);

// 4. Spinning circle token border
sequence.effect()
    .file(closest(`jb2a.token_border.circle.spinning.${variant}.004`))
    .atLocation(token)
    .scaleToObject(2.2)
    .playbackRate(1)
    .attachTo(token)
    .persist()
    .name(label);

// 5. Orbiting flame shield below token
sequence.effect()
    .file(closest(`jb2a.shield_themed.below.fire.03.${variant}`))
    .atLocation(token)
    .delay(1000)
    .persist()
    .fadeIn(500)
    .attachTo(token)
    .fadeOut(200)
    .belowTokens()
    .scaleToObject(1.7)
    .playbackRate(1)
    .name(label);

// 6. Orbiting flame shield above token
sequence.effect()
    .file(closest(`jb2a.shield_themed.above.fire.03.${variant}`))
    .atLocation(token)
    .persist()
    .fadeIn(3500)
    .attachTo(token)
    .fadeOut(200)
    .scaleToObject(1.7)
    .zIndex(0)
    .playbackRate(1)
    .name(label);

await sequence.play();
