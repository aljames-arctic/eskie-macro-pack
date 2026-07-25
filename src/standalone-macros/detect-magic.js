// Standalone Macro: Detect Magic
// Original Author: EskieMoh#2969 for Divine Sense / Tyreal2012
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Detect Magic' macro requires the 'Sequencer' module to be installed and active!");
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

const distanceFeet = 30;
const detectionConfig = {
    abjuration: "jb2a.magic_signs.rune.abjuration.complete.red",
    conjuration: "jb2a.magic_signs.rune.conjuration.complete.pink",
    divination: "jb2a.magic_signs.rune.divination.complete.blue",
    enchantment: "jb2a.magic_signs.rune.enchantment.complete.purple",
    illusion: "jb2a.magic_signs.rune.illusion.complete.yellow",
    necromancy: "jb2a.magic_signs.rune.necromancy.complete.green",
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

sequence.effect()
    .file(closest("jb2a.detect_magic.circle.purple"))
    .atLocation(token)
    .size(distanceFeet * 2, { gridUnits: true })
    .fadeOut(4000)
    .opacity(0.75)
    .belowTokens();

for (const target of targets) {
    const targetDistance = getDistanceFeet(token, target);
    const waveDelay = (targetDistance / (canvas.dimensions.distance ?? 5)) * 125;

    const matchedTags = [];
    for (const school of Object.keys(detectionConfig)) {
        const hasTagger = typeof Tagger !== "undefined" && Tagger.hasTags(target, [school]);
        const items = target.actor?.items ?? [];
        const hasSpellSchool = Array.from(items).some((item) =>
            (item.system?.school ?? "").toLowerCase() === school
            || (item.name ?? "").toLowerCase().includes(school)
        );
        if (hasTagger || hasSpellSchool) {
            matchedTags.push(school);
        }
    }

    if (matchedTags.length === 0) continue;

    const targetRotation = target.document?.rotation ?? target.rotation ?? 0;

    sequence.effect()
        .copySprite(target)
        .belowTokens()
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .spriteRotation(-targetRotation)
        .filter("Glow", { color: 0x9b59b6, distance: 15 })
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
            .delay(waveDelay + i * 5000)
            .duration(4000)
            .fadeIn(500)
            .fadeOut(500, { ease: "easeInSine" })
            .opacity(0.85)
            .zIndex(0.1);
    }
}

await sequence.play();
