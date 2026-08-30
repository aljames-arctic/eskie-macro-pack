// Standalone Macro: Divine Sense
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Divine Sense' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select your Paladin token!");

const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const distanceFeet = 60;
const detectionConfig = {
    celestial: "jb2a.condition.curse.01.002.blue",
    fiend: "jb2a.condition.curse.01.024.red",
    undead: "jb2a.condition.curse.01.021.purple",
};

const getDistanceFeet = (t1, t2) => {
    if (canvas.grid.measurePath) {
        const measured = canvas.grid.measurePath([t1, t2]);
        return measured?.euclidean ?? measured?.cost ?? 0;
    }
    const dx = Math.abs(t1.x - t2.x) / canvas.grid.size;
    const dy = Math.abs(t1.y - t2.y) / canvas.grid.size;
    return Math.hypot(dx, dy) * (canvas.dimensions.distance ?? 5);
};

const targets = canvas.tokens.placeables.filter((t) => {
    if (t.id === token.id) return false;
    return getDistanceFeet(token, t) <= distanceFeet;
});

const sequence = new Sequence();

// Expanding gold pulse radar ring from caster
sequence.effect()
    .file(closest("jb2a.detect_magic.circle.yellow"))
    .atLocation(token)
    .size(distanceFeet * 2, { gridUnits: true })
    .fadeOut(4000)
    .opacity(0.75)
    .belowTokens();

for (const target of targets) {
    const targetDistance = getDistanceFeet(token, target);
    const waveDelay = (targetDistance / (canvas.dimensions.distance ?? 5)) * 125;
    const targetType = (target.actor?.system?.details?.type?.value ?? "").toLowerCase();
    const customType = (target.actor?.system?.details?.type?.custom ?? "").toLowerCase();

    const matchedTags = [];
    for (const tag of Object.keys(detectionConfig)) {
        const isMatch = targetType.includes(tag) || customType.includes(tag)
            || (game.modules.get('tagger')?.active && Tagger.hasTags(target, [tag]));
        if (isMatch) {
            matchedTags.push(tag);
        }
    }

    if (matchedTags.length === 0) continue;

    const targetRotation = target.document?.rotation ?? target.rotation ?? 0;

    // Golden halo indicator over validated celestial/fiend/undead
    sequence.effect()
        .copySprite(target)
        .belowTokens()
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .spriteRotation(-targetRotation)
        .filter("Glow", { color: 0xffd700, distance: 15 })
        .duration(15000)
        .delay(waveDelay)
        .fadeIn(500)
        .fadeOut(1000, { ease: "easeInCubic" })
        .zIndex(0.2)
        .opacity(1);

    for (let i = 0; i < matchedTags.length; i++) {
        const tag = matchedTags[i];
        sequence.effect()
            .file(closest(detectionConfig[tag]))
            .attachTo(target, { bindRotation: false })
            .scaleToObject(1, { considerTokenScale: true })
            .delay(waveDelay + i * 5500)
            .duration(4000)
            .fadeIn(500)
            .fadeOut(500, { ease: "easeInSine" })
            .opacity(0.85)
            .zIndex(0.1);
    }
}

await sequence.play();
