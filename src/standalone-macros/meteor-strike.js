// Standalone Macro: Meteor Strike
// Original Author: .tranquilite.
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Meteor Strike' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const id = "meteor-strike";
const label = `${id}-${token.id ?? token.name ?? "caster"}`;

// 2. Toggle / Re-entrant Persistent Effect Handling
const activeEffects = Sequencer.EffectManager.getEffects({ name: label });
if (activeEffects.length > 0) {
    Sequencer.EffectManager.endEffects({ name: label });
    return ui.notifications.info("Meteor Strike effects terminated.");
}

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct database key if running as a standalone copy-paste macro.
 */
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

// 3. Target / Position Validation and Selection
async function getStrikePositions() {
    if (game.user.targets.size > 0) {
        return Array.from(game.user.targets).map((t) => ({
            x: t.center?.x ?? t.x ?? 0,
            y: t.center?.y ?? t.y ?? 0,
        }));
    }

    const positions = [];
    ui.notifications.info("Click to select strike positions. Right-click or press Escape to finish.");
    let index = 1;
    while (true) {
        const cross = await Sequencer.Crosshair.show({
            label: { text: `Meteor Strike #${index}`, dx: 0, dy: 50 },
            icon: "icons/magic/fire/projectile-feathers-salvo-orange.webp",
            tag: `${id}-crosshair`,
        });
        if (!cross || cross.cancelled || cross.x === undefined) break;
        positions.push({ x: cross.x, y: cross.y });
        index++;
    }
    return positions;
}

const positions = await getStrikePositions();
if (!positions || positions.length === 0) {
    return ui.notifications.warn("No positions or targets selected for Meteor Strike!");
}

const sequence = new Sequence();

for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    const isFirst = i === 0;
    const isLast = i === positions.length - 1;

    let fireScale = 0.3;
    if (isFirst) fireScale = 0.5;
    if (isLast) fireScale = 0.75;

    // Staggered arrival delays: First Meteor ~0-200ms, Second ~300-500ms, Third ~600-800ms, etc.
    const meteorDelay = 300 * i + Math.random() * 200;

    // 1. Falling flaming meteorite descending from the sky
    sequence.effect()
        .name(label)
        .file(closest("jb2a.fireball.beam.orange"))
        .atLocation({ x: pos.x + 350, y: pos.y - 850 })
        .stretchTo(pos)
        .scale(fireScale * 1.1)
        .delay(meteorDelay)
        .waitUntilFinished(-150);

    // 2. Primary fire swirl effect at impact point
    sequence.effect()
        .name(label)
        .file(closest("blfx.spell.cast.swirl1.fire1.orange"))
        .atLocation(pos)
        .scale(fireScale)
        .delay(meteorDelay);

    // 3. Ground crater shockwave & radial blast wave
    sequence.effect()
        .name(label)
        .file(closest("jb2a.shockwave.01.orange"))
        .atLocation(pos)
        .size(fireScale * 7, { gridUnits: true })
        .belowTokens()
        .delay(meteorDelay + 50)
        .opacity(0.85)
        .duration(800)
        .fadeOut(300);

    sequence.effect()
        .name(label)
        .file(closest("jb2a.impact.ground_crack.01.orange"))
        .atLocation(pos)
        .belowTokens()
        .scale(fireScale * 2.2)
        .delay(meteorDelay + 50)
        .fadeIn(150)
        .fadeOut(2000)
        .duration(7000)
        .persist()
        .zIndex(0);

    // Camera impact shake
    sequence.canvasPan()
        .delay(meteorDelay + 50)
        .shake({ duration: 450, strength: isLast ? 4 : 2, rotation: false, fadeOut: 200 });

    // 4. Fiery explosion on strike
    sequence.effect()
        .name(label)
        .file(closest("jb2a.explosion.01.orange"))
        .atLocation(pos)
        .scale(isLast ? 1.0 : (isFirst ? 0.65 : 0.75))
        .delay(meteorDelay + 50);

    // 5. Lingering magma burn fires at impact crater
    sequence.effect()
        .name(label)
        .file(closest("jb2a.fireplace.01.orange"))
        .atLocation(pos)
        .belowTokens()
        .scale(fireScale * 0.95)
        .delay(meteorDelay + 180)
        .fadeIn(400)
        .fadeOut(1500)
        .duration(7000)
        .persist()
        .zIndex(1);

    // 6. Lingering billowed plume smoke effect
    sequence.effect()
        .name(label)
        .file(closest("eskie.smoke.03.white"))
        .atLocation(pos)
        .fadeIn(300)
        .fadeOut(400)
        .delay(1350 + meteorDelay);
}

await sequence.play();
