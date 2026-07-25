// Standalone Macro: Fire Blast
// Original Author: yamiakane (@yamiakane on Discord)
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Fire Blast' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

// 2. Target Token Validation
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    return ui.notifications.warn("Please select at least one target!");
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

const DEFAULT_CONFIG = {
    id: "FireBlast",
    pushDistance: 80,
    knockbackDuration: 200,
    returnDuration: 600,
    sound: {
        enabled: true,
        volume: 0.5,
    },
};

const id = DEFAULT_CONFIG.id ?? "FireBlast";
const label = `${id}-${token.id ?? ""}`;

// 3. Toggle / Re-entrant Persistent Effect Handling
let isPlaying = false;
for (const target of targets) {
    if (Sequencer.EffectManager.getEffects({ name: label, object: target }).length > 0 ||
        Sequencer.EffectManager.getEffects({ name: id, object: target }).length > 0) {
        isPlaying = true;
        break;
    }
}
if (!isPlaying && (Sequencer.EffectManager.getEffects({ name: label }).length > 0 ||
                   Sequencer.EffectManager.getEffects({ name: id }).length > 0)) {
    isPlaying = true;
}

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label });
    Sequencer.EffectManager.endEffects({ name: id });
    for (const target of targets) {
        Sequencer.EffectManager.endEffects({ name: label, object: target });
        Sequencer.EffectManager.endEffects({ name: id, object: target });
        new Sequence().animation().on(target).opacity(1).fadeIn(200).play();
    }
    new Sequence().animation().on(token).opacity(1).fadeIn(200).play();
    return;
}

const pushDistance = DEFAULT_CONFIG.pushDistance ?? 80;
const knockbackDuration = DEFAULT_CONFIG.knockbackDuration ?? 200;
const returnDuration = DEFAULT_CONFIG.returnDuration ?? 600;
const soundEnabled = DEFAULT_CONFIG.sound?.enabled ?? true;
const soundVolume = DEFAULT_CONFIG.sound?.volume ?? 0.5;
const gridSize = canvas.grid?.size ?? 100;

const sequence = new Sequence();

for (const target of targets) {
    const tokenCenterX = token.center?.x ?? token.x ?? 0;
    const tokenCenterY = token.center?.y ?? token.y ?? 0;
    const targetCenterX = target.center?.x ?? target.x ?? 0;
    const targetCenterY = target.center?.y ?? target.y ?? 0;

    // Vector calculations for knockback
    const dx = targetCenterX - tokenCenterX;
    const dy = targetCenterY - tokenCenterY;
    const dist = Math.hypot(dx, dy);

    if (dist === 0) continue;

    const nx = dx / dist;
    const ny = dy / dist;
    const nxt = -nx;
    const nyt = -ny;

    const tokenRotation = token.document?.rotation ?? token.rotation ?? 0;
    const targetRotation = target.document?.rotation ?? target.rotation ?? 0;

    // --- Charging Phase ---
    if (soundEnabled) {
        sequence.sound()
            .delay(200)
            .file(closest("blfx.sound.misc.impact.fire1.4"))
            .volume(soundVolume);

        sequence.sound()
            .file(closest("blfx.sound.spell.elementalism1.1"))
            .volume(soundVolume * 0.8);
    }

    sequence.effect()
        .name(label)
        .file(closest("jb2a.divine_smite.caster.standard.orange"))
        .atLocation(token)
        .scaleToObject(0.5, { considerTokenScale: true })
        .playbackRate(1.6)
        .aboveInterface()
        .waitUntilFinished(-500);

    sequence.effect()
        .name(label)
        .file(closest("jb2a.lightning_orb.01.loop.bluepurple"))
        .filter("ColorMatrix", { hue: 90, contrast: 1.5 })
        .tint("#e6a900")
        .attachTo(token)
        .scaleToObject(0.3, { considerTokenScale: true })
        .duration(2500)
        .fadeIn(200)
        .fadeOut(400)
        .aboveInterface()
        .animateProperty("spriteContainer", "position.x", { from: 0, to: 0.5, duration: 1200, gridUnits: true, ease: "easeInOutQuad" })
        .loopProperty("spriteContainer", "rotation", { from: 0, to: 360, duration: 2000, ease: "linear" })
        .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 2000, ease: "linear" });

    sequence.effect()
        .name(label)
        .file(closest("blfx.spell.template.circle.emanating.aura3.loop.radial.color5"))
        .filter("ColorMatrix", { hue: 30, saturate: 2 })
        .fadeIn(500)
        .fadeOut(300)
        .attachTo(token)
        .duration(2500)
        .scaleToObject(0.33, { considerTokenScale: true })
        .opacity(0.6)
        .belowTokens();

    if (soundEnabled) {
        sequence.sound()
            .file(closest("blfx.sound.spell.loop_channel.fire_burning1.5"))
            .fadeInAudio(200)
            .fadeOutAudio(500)
            .duration(2500)
            .volume(soundVolume);

        sequence.sound()
            .file(closest("blfx.sound.ability.breath.1"))
            .volume(soundVolume);

        sequence.sound()
            .delay(400)
            .file(closest("blfx.sound.misc.shock_wave.2"))
            .volume(soundVolume);
    }

    sequence.effect()
        .name(label)
        .file(closest("blfx.spell.cast.swirl1.fire1.loop.orange"))
        .scaleToObject(0.2, { considerTokenScale: true })
        .fadeIn(600)
        .fadeOut(600)
        .attachTo(token)
        .belowTokens()
        .duration(2500)
        .waitUntilFinished(-1000);

    // --- Final Attack Phase ---
    sequence.effect()
        .name(label)
        .file(closest("jb2a.ranged_helix.hit.001.orangeyellow"))
        .scaleToObject(0.6, { considerTokenScale: true })
        .atLocation(token)
        .randomRotation()
        .belowTokens();

    if (soundEnabled) {
        sequence.sound()
            .file(closest("blfx.sound.spell.cast.fire.1"))
            .volume(soundVolume);
    }

    sequence.effect()
        .name(label)
        .file(closest("jb2a.ranged_helix.cast.001.orangeyellow"))
        .atLocation(token)
        .scaleToObject(0.6, { considerTokenScale: true })
        .spriteOffset({ x: -1.8 }, { gridUnits: true })
        .rotateTowards(target)
        .belowTokens()
        .waitUntilFinished(-1850);

    sequence.animation()
        .delay(200)
        .on(token)
        .opacity(0);

    if (soundEnabled) {
        sequence.sound()
            .file(closest("blfx.sound.spell.sacred_flame1.impact.2"))
            .volume(soundVolume);
    }

    sequence.effect()
        .name(label)
        .file(closest("jb2a.on_token_buff.001.003.orangeyellow"))
        .atLocation(token)
        .scaleToObject(0.5, { considerTokenScale: true });

    if (soundEnabled) {
        sequence.sound()
            .file(closest("blfx.sound.spell.cast.burning_hands.2"))
            .volume(soundVolume);

        sequence.sound()
            .file(closest("blfx.sound.spell.cast.fireball.4"))
            .volume(soundVolume);
    }

    sequence.effect()
        .name(label)
        .file(closest("jb2a.ranged_missile.cast.001.orangeyellow"))
        .atLocation(token)
        .scaleToObject(0.5, { considerTokenScale: true })
        .spriteOffset({ x: -75 })
        .rotateTowards(target)
        .waitUntilFinished(-1000);

    // Source Knockback
    sequence.effect()
        .name(label)
        .delay(100)
        .copySprite(token)
        .spriteRotation(-tokenRotation)
        .animateProperty("spriteContainer", "position.x", {
            from: 0,
            to: nxt * gridSize * 0.2,
            duration: knockbackDuration,
            ease: "easeOutExpo"
        })
        .animateProperty("spriteContainer", "position.y", {
            from: 0,
            to: nyt * gridSize * 0.2,
            duration: knockbackDuration,
            ease: "easeOutExpo"
        });

    sequence.effect()
        .name(label)
        .delay(100)
        .copySprite(token)
        .spriteRotation(-tokenRotation)
        .animateProperty("spriteContainer", "position.x", {
            from: nxt * gridSize * 0.2,
            to: 0,
            duration: returnDuration,
            ease: "easeInQuart"
        })
        .animateProperty("spriteContainer", "position.y", {
            from: nyt * gridSize * 0.2,
            to: 0,
            duration: returnDuration,
            ease: "easeInQuart"
        });

    sequence.animation()
        .delay(returnDuration + 60)
        .on(token)
        .opacity(1);

    // Explosive Infernal Flame Torrent Ray Projectile
    sequence.effect()
        .name(label)
        .file(closest("jb2a.ranged.04.projectile.01.orange"))
        .tint("#fce703")
        .atLocation(token)
        .stretchTo(target)
        .opacity(1)
        .waitUntilFinished(-1000);

    if (soundEnabled) {
        sequence.sound()
            .file(closest("blfx.sound.spell.cast.fireball.2"))
            .volume(soundVolume);

        sequence.sound()
            .delay(200)
            .file(closest("blfx.sound.misc.fire.throw.1"))
            .volume(soundVolume);
    }

    // Impact: Explosion
    sequence.effect()
        .name(label)
        .file(closest("jb2a.explosion.01.orange"))
        .atLocation(target)
        .scaleToObject(0.6, { considerTokenScale: true })
        .opacity(1)
        .zIndex(2);

    // Impact: Ground Scorch Mark
    sequence.effect()
        .name(label)
        .file(closest("jb2a.impact.ground_crack.01.orange"))
        .atLocation(target)
        .belowTokens()
        .scaleToObject(0.8, { considerTokenScale: true })
        .fadeIn(100)
        .fadeOut(1000)
        .duration(3000)
        .zIndex(0);

    // Impact: Ember Sparks Impact
    sequence.effect()
        .name(label)
        .file(closest("jb2a.particles.outward.orange.01.02"))
        .atLocation(target)
        .scaleToObject(1.2, { considerTokenScale: true })
        .fadeIn(100)
        .fadeOut(800)
        .duration(1500)
        .zIndex(3);

    sequence.animation()
        .on(target)
        .opacity(0);

    // Target Knockback
    sequence.effect()
        .name(label)
        .copySprite(target)
        .spriteRotation(-targetRotation)
        .animateProperty("spriteContainer", "position.x", {
            from: 0,
            to: nx * pushDistance * 0.15,
            duration: knockbackDuration,
            ease: "easeOutExpo"
        })
        .animateProperty("spriteContainer", "position.y", {
            from: 0,
            to: ny * pushDistance * 0.15,
            duration: knockbackDuration,
            ease: "easeOutExpo"
        })
        .zIndex(1);

    sequence.effect()
        .name(label)
        .delay(100)
        .copySprite(target)
        .spriteRotation(-targetRotation)
        .animateProperty("spriteContainer", "position.x", {
            from: nx * pushDistance * 0.15,
            to: 0,
            duration: returnDuration,
            ease: "easeInQuart"
        })
        .animateProperty("spriteContainer", "position.y", {
            from: ny * pushDistance * 0.15,
            to: 0,
            duration: returnDuration,
            ease: "easeInQuart"
        })
        .zIndex(1);

    sequence.animation()
        .delay(returnDuration + 50)
        .on(target)
        .opacity(1);
}

await sequence.play();
