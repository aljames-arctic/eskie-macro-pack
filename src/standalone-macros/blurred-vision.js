// Standalone Macro: Blurred Vision
// Original Author: bakanabaka / Gornetron
// Standalone Conversion: eskie-macro-pack

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Blurred Vision' macro requires the 'Sequencer' module to be installed and active!");
}

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const bgSrc = canvas?.scene?.background?.src;
if (!bgSrc) {
    return ui.notifications.warn("canvas.scene.background.src not set. Background blurring failed!");
}

const id = "blurred-vision";
const overlayConfig = {
    applyPC: true,
    applyGM: false,
};

const configs = [
    { opacity: 1, blur: 3, sway: 1, durationX: 6500, durationY: 11000 },
    { opacity: 0.57, blur: 3, sway: -0.9, durationX: 16500, durationY: 7000 },
    { opacity: 0.47, blur: 3, sway: 1.1, durationX: 13000, durationY: 10500 },
];

// Determine owners of token to show screen blur overlay to
const ownership = token.actor?.ownership ?? token.document?.ownership ?? {};
let owners = game.users?.filter(user => ownership[user.id] === 3) ?? [];
if (!overlayConfig.applyPC) owners = owners.filter(user => user.isGM);
if (!overlayConfig.applyGM) owners = owners.filter(user => !user.isGM);

// Fallback to game.user if no specific player owners matched criteria
if (owners.length === 0 && game.user) {
    owners = [game.user];
}

const SEQUENCER_DEFAULT_OPACITY = 50;
const userEffectOpacity = game.settings?.get("sequencer", "user-effect-opacity") ?? SEQUENCER_DEFAULT_OPACITY;
if (!overlayConfig.applyGM && userEffectOpacity === SEQUENCER_DEFAULT_OPACITY) {
    console.warn(`Sequencer user-effect-opacity is set to default (${SEQUENCER_DEFAULT_OPACITY}). This will cause the blurred vision effect to appear for GMs as well.`);
}

// Toggle / re-entrant persistent effect handling
const isPlaying = owners.some(user => {
    const effectName = `${id} - ${user.name}`;
    const tokenEffectName = `${id} - ${token.id} - ${user.name}`;
    return (Sequencer.EffectManager.getEffects({ name: effectName })?.length ?? 0) > 0
        || (Sequencer.EffectManager.getEffects({ name: tokenEffectName })?.length ?? 0) > 0;
}) || (Sequencer.EffectManager.getEffects({ name: `${id}*` })?.length ?? 0) > 0;

if (isPlaying) {
    owners.forEach(user => {
        Sequencer.EffectManager.endEffects({ name: `${id} - ${user.name}` });
        Sequencer.EffectManager.endEffects({ name: `${id} - ${token.id} - ${user.name}` });
    });
    Sequencer.EffectManager.endEffects({ name: `${id}*` });
    return;
}

const sceneWidth = canvas.scene?.dimensions?.sceneWidth ?? canvas.scene?.width ?? 1000;
const sceneHeight = canvas.scene?.dimensions?.sceneHeight ?? canvas.scene?.height ?? 1000;
const x = (canvas.scene?.dimensions?.width ?? sceneWidth) / 2;
const y = (canvas.scene?.dimensions?.height ?? sceneHeight) / 2;
const gridSize = canvas.grid?.size ?? 100;

const seq = new Sequence();

for (const user of owners) {
    const effectName = `${id} - ${token.id} - ${user.name}`;

    for (const effectConfig of configs) {
        const opacity = effectConfig.opacity ?? 1;
        const blur = effectConfig.blur ?? 3;
        const sway = effectConfig.sway ?? 1;
        const durationX = effectConfig.durationX ?? 7000;
        const durationY = effectConfig.durationY ?? 11000;
        const drift = (gridSize / 8) * sway;

        seq.effect()
            .name(effectName)
            .file(bgSrc)
            .atLocation({ x, y })
            .size({
                width: sceneWidth,
                height: sceneHeight
            })
            .belowTokens()
            .belowTiles()
            .filter("Blur", { blurX: blur, blurY: blur })
            .opacity(opacity)
            .loopProperty("spriteContainer", "position.x", { from: -drift, to: drift, duration: durationX, pingPong: true })
            .loopProperty("spriteContainer", "position.y", { from: -drift, to: drift, duration: durationY, pingPong: true })
            .forUsers(user.id)
            .persist();
    }
}

await seq.play();
