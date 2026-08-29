// Standalone Macro: Call Lightning
// Original Author: .eskie
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Call Lightning' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct string path if running as a standalone copy-paste macro.
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

const DEFAULT_CONFIG = {
    radius: 7.5,
    cloudRadius: 12,
};

const id = "call-lightning";
const label = `${id}-${token.id}`;

// 2. Toggle / Re-entrant Persistent Effect Check
const getActiveCloudEffects = () => {
    return Sequencer.EffectManager.getEffects({ name: label, object: token }).concat(
        Sequencer.EffectManager.getEffects({ name: label })
    );
};

const stopStormCloud = () => {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label });
    ui.notifications.info("Call Lightning storm cloud dismissed.");
};

/**
 * Resolves target token or crosshair point location for downward lightning bolt strike.
 */
async function getStrikeLocation(labelPrompt = "Call Lightning Strike") {
    if (game.user.targets.size > 0) {
        const target = Array.from(game.user.targets)[0];
        return target.center ?? { x: target.x, y: target.y };
    }

    const crosshairCfg = {
        size: 1,
        icon: 'icons/magic/lightning/bolt-cloud-sky-blue.webp',
        label: labelPrompt,
        drawIcon: true,
        drawOutline: true,
        interval: (token.document?.width ?? 1) % 2 === 0 ? 1 : -1,
    };
    const position = await Sequencer.Crosshair.show(crosshairCfg);
    if (!position || position.cancelled) return null;
    return position;
}

/**
 * Plays the downward lightning bolt strike visual sequence on target or point location.
 */
function addLightningStrikeToSequence(sequence, position, config = {}) {
    // Downward lightning bolt strike from sky / storm cloud
    sequence.effect()
        .file(closest("jb2a.lightning_strike.blue"))
        .atLocation(position)
        .scale(2.25)
        .opacity(1)
        .aboveLighting()
        .filter("ColorMatrix", { hue: -5 })
        .zIndex(100);

    // Camera pan and screen shake on strike impact
    sequence.canvasPan()
        .delay(250)
        .shake({ duration: 1000, strength: 2, rotation: false, fadeOut: 500 });

    // Ground crack impact below tokens
    sequence.effect()
        .delay(250)
        .file(closest("jb2a.impact.ground_crack.blue.01"))
        .atLocation(position)
        .belowTokens()
        .randomRotation()
        .size(4, { gridUnits: true })
        .filter("ColorMatrix", { hue: 40 });
}

/**
 * Spawns the persistent storm cloud swirl vortex overhead.
 */
function addStormCloudToSequence(sequence, centerPosition, config = {}) {
    const cloudSize = (config.cloudRadius ?? DEFAULT_CONFIG.cloudRadius) * 2;

    // Outer dark storm cloud swirl
    sequence.effect()
        .name(label)
        .file(closest("jb2a.smoke.puff.centered.grey"))
        .atLocation(centerPosition)
        .size(cloudSize, { gridUnits: true })
        .opacity(0.65)
        .aboveLighting()
        .filter("ColorMatrix", { brightness: -0.4, saturate: -0.5, hue: -10 })
        .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 30000 })
        .persist()
        .zIndex(90);

    // Crackling static electricity vortex inside storm cloud
    sequence.effect()
        .name(label)
        .file(closest("jb2a.static_electricity.01.blue"))
        .atLocation(centerPosition)
        .size(cloudSize * 0.75, { gridUnits: true })
        .opacity(0.75)
        .aboveLighting()
        .filter("ColorMatrix", { hue: -5, brightness: 0.2 })
        .loopProperty("sprite", "rotation", { from: 360, to: 0, duration: 15000 })
        .persist()
        .zIndex(91);

    // Evocation swirl magic ring overhead
    sequence.effect()
        .name(label)
        .file(closest("jb2a.magic_signs.circle.02.conjuration.loop.blue"))
        .atLocation(centerPosition)
        .size(cloudSize * 0.5, { gridUnits: true })
        .opacity(0.35)
        .aboveLighting()
        .filter("ColorMatrix", { hue: -10 })
        .persist()
        .zIndex(92);
}

// Check active status
const activeEffects = getActiveCloudEffects();
const isCloudActive = activeEffects.length > 0;

if (isCloudActive) {
    // If active, ask whether to call down another lightning strike or stop/dismiss the storm cloud
    let action = "cancel";
    const dialogCls = foundry.applications?.api?.DialogV2;
    if (dialogCls?.wait) {
        action = await dialogCls.wait({
            window: { title: "Call Lightning Active" },
            content: "<p>A Call Lightning storm cloud vortex is active overhead. What would you like to do?</p>",
            buttons: [
                {
                    action: "strike",
                    label: "Call Down Lightning Strike",
                    icon: "fa-solid fa-bolt",
                    default: true
                },
                {
                    action: "stop",
                    label: "Dismiss Storm Cloud (Stop)",
                    icon: "fa-solid fa-circle-xmark"
                }
            ],
            rejectClose: false
        }) ?? "cancel";
    } else {
        action = await new Promise((resolve) => {
            new Dialog({
                title: "Call Lightning Active",
                content: "<p>A Call Lightning storm cloud vortex is active overhead. What would you like to do?</p>",
                buttons: {
                    strike: {
                        icon: '<i class="fas fa-bolt"></i>',
                        label: "Call Down Lightning Strike",
                        callback: () => resolve("strike")
                    },
                    stop: {
                        icon: '<i class="fas fa-times-circle"></i>',
                        label: "Dismiss Storm Cloud (Stop)",
                        callback: () => resolve("stop")
                    }
                },
                default: "strike",
                close: () => resolve("cancel")
            }).render(true);
        });
    }

    if (action === "stop") {
        stopStormCloud();
    } else if (action === "strike") {
        const strikePos = await getStrikeLocation("Call Lightning Bolt Strike");
        if (!strikePos) return;

        const seq = new Sequence();
        addLightningStrikeToSequence(seq, strikePos, DEFAULT_CONFIG);
        await seq.play();
    }
} else {
    // Initial casting: prompt for target or location for downward lightning bolt strike
    const strikePos = await getStrikeLocation("Call Lightning Initial Strike");
    if (!strikePos) return;

    const cloudCenter = token.center ?? { x: token.x, y: token.y };

    const seq = new Sequence();
    // 1. Create persistent storm cloud swirl vortex overhead
    addStormCloudToSequence(seq, cloudCenter, DEFAULT_CONFIG);
    // 2. Fire downward lightning bolt strike at target/point location
    addLightningStrikeToSequence(seq, strikePos, DEFAULT_CONFIG);

    await seq.play();
}
