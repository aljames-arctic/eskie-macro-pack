// Standalone Macro: Sneak Attack
// Original Author: .eskie
// Modular Conversion: standalone-macro

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Sneak Attack' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please target a token!");
}

const DEFAULT_CONFIG = {
    id: "sneakAttack",
    mode: "auto", // "auto", "melee", or "ranged"
    melee: {
        color: {
            attack: "redblack",
            impact: "red",
            damage: "red",
        },
        type: "slashing",
        weight: "medium",
    },
    ranged: {
        color: {
            attack: "red",
            impact: "red",
            damage: "red",
        }
    }
};

const config = DEFAULT_CONFIG;
const id = config.id ?? "sneakAttack";
const label = `${id}-${token.id}`;
const mode = config.mode ?? "auto";

const adapter = game.modules.get("eskie-macros").api.adapter;
const closest = (path) => game.modules.get("eskie-macros").api.util.closest(path);


// 3. Toggle / Re-entrant Persistent Effect Handling
const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0 ||
                  Sequencer.EffectManager.getEffects({ name: label }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
    Sequencer.EffectManager.endEffects({ name: label });
    for (const target of targets) {
        Sequencer.EffectManager.endEffects({ name: label, object: target });
    }
    return;
}

const tokenWidth = token.document?.width ?? 1;

// Melee attack sizing geometry
const meleeConfig = config.melee ?? {};
const meleeType = meleeConfig.type ?? "slashing";
const meleeWeight = meleeConfig.weight ?? "medium";
const meleeColor = meleeConfig.color ?? {};
const meleeColorAttack = meleeColor.attack ?? "redblack";
const meleeColorImpact = meleeColor.impact ?? "red";
const meleeColorDamage = meleeColor.damage ?? "red";

const weightMap = { light: 0, medium: 1, heavy: 2 };
const weightIndex = weightMap[meleeWeight] ?? 1;
const effectSize = 2 + (0.25 * weightIndex);
const effectOffset = -0.75 - (0.25 * weightIndex);

// Ranged attack styling
const rangedConfig = config.ranged ?? {};
const rangedColor = rangedConfig.color ?? {};
const rangedColorAttack = rangedColor.attack ?? "red";
const rangedColorImpact = rangedColor.impact ?? "red";
const rangedColorDamage = rangedColor.damage ?? "red";

const sequence = new Sequence();

for (const target of targets) {
    const targetRotation = target.document?.rotation ?? 0;
    const targetSquare = adapter.getNearestSquareCenter(token, target);

    // Determine attack style: if auto, pick melee if within reach, else ranged
    const useMelee = mode === "melee" || (mode === "auto" && adapter.isAdjacent(token, target));

    if (useMelee) {
        // Vital spot melee strike dagger slash
        sequence.effect()
            .name(label)
            .file(closest(`eskie.attack.melee.generic.01.${meleeType}.${meleeWeight}.${meleeColorAttack}.slow`))
            .atLocation(token)
            .rotateTowards(targetSquare)
            .scaleToObject(effectSize)
            .spriteOffset({ x: effectOffset * tokenWidth }, { gridUnits: true })
            .randomizeMirrorY()
            .zIndex(1);

        // Vital spot impact flash
        sequence.effect()
            .name(label)
            .delay(150)
            .file(closest(`jb2a.impact.008.${meleeColorImpact}`))
            .size(1.25 * tokenWidth, { gridUnits: true })
            .atLocation(targetSquare)
            .randomRotation()
            .playbackRate(0.9)
            .zIndex(0.1);

        // Blood splatter precision damage flare
        sequence.effect()
            .name(label)
            .delay(150)
            .file(closest(`jb2a.liquid.splash_side.${meleeColorDamage}`))
            .atLocation(targetSquare)
            .size(1.5 * tokenWidth, { gridUnits: true })
            .rotateTowards(token)
            .spriteOffset({ x: -1.15 * tokenWidth }, { gridUnits: true })
            .spriteRotation(180)
            .zIndex(0);

        // Target shock reaction / tint impact shake
        sequence.effect()
            .name(label)
            .delay(150)
            .copySprite(target)
            .spriteRotation(-targetRotation)
            .attachTo(target)
            .scaleToObject(1, { considerTokenScale: true })
            .loopProperty('spriteContainer', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
            .opacity(0.25)
            .duration(1000)
            .fadeOut(750)
            .tint("#FF0000");
    } else {
        // Vital spot ranged precision strike slice
        sequence.effect()
            .name(label)
            .file(closest(`eskie.slice.01_ranged.black.${rangedColorAttack}`))
            .atLocation(token)
            .stretchTo(target)
            .spriteOffset({ x: tokenWidth / 2 }, { gridUnits: true })
            .zIndex(1);

        // Vital spot impact flash
        sequence.effect()
            .name(label)
            .delay(150)
            .file(closest(`jb2a.impact.008.${rangedColorImpact}`))
            .size(1.25 * tokenWidth, { gridUnits: true })
            .atLocation(target)
            .randomRotation()
            .playbackRate(0.9)
            .zIndex(0.1);

        // Blood splatter precision damage flare
        sequence.effect()
            .name(label)
            .delay(150)
            .file(closest(`jb2a.liquid.splash_side.${rangedColorDamage}`))
            .atLocation(target)
            .size(1.5 * tokenWidth, { gridUnits: true })
            .rotateTowards(token)
            .spriteOffset({ x: -1.15 * tokenWidth }, { gridUnits: true })
            .spriteRotation(180)
            .zIndex(0);

        // Target shock reaction / tint impact shake
        sequence.effect()
            .name(label)
            .delay(150)
            .copySprite(target)
            .spriteRotation(-targetRotation)
            .attachTo(target)
            .scaleToObject(1, { considerTokenScale: true })
            .loopProperty('spriteContainer', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
            .opacity(0.25)
            .duration(1000)
            .fadeOut(750)
            .tint("#FF0000");
    }
}

await sequence.play();
