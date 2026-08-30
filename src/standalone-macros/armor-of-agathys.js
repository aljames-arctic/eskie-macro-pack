// Standalone Macro: Armor of Agathys
// Original Author: EskieMoh#2969
// Modular Conversion: bakanabaka

if (!game.modules.get("sequencer")?.active) {
    return ui.notifications.error("The 'Armor of Agathys' macro requires the 'Sequencer' module to be installed and active!");
}

// 1. Casting Token Validation
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

/**
 * Safely resolves Free vs Patreon asset paths if the eskie module is active.
 * Falls back to direct string path if running as a standalone copy-paste macro.
 */
const closest = (path) => game.modules.get('eskie-macros')?.api?.util?.closest?.(path) ?? path;

const id = "Armor of Agathys";
const tokenName = token.document?.name ?? token.name ?? "Token";
const label = `${tokenName} ${id}`;
const scaleX = token.document?.texture?.scaleX ?? 1;
const targets = Array.from(game.user.targets ?? []);

// 2. Retaliatory Cold Spike Burst on Hit (when targeting an attacker)
if (targets.length > 0) {
    const sequence = new Sequence();

    for (const target of targets) {
        const targetRotation = target.document?.rotation ?? target.rotation ?? 0;

        // Cold impact beam from protected token towards attacker target
        sequence.effect()
            .file(closest("jb2a.impact.004.blue"))
            .atLocation(token)
            .rotateTowards(target)
            .scaleToObject(1.45)
            .spriteScale({ x: 0.75, y: 1.0 })
            .filter("ColorMatrix", { saturate: -0.75, brightness: 1.5 })
            .spriteOffset({ x: -0.15 }, { gridUnits: true });

        // Ice shard side impact spike burst on target
        sequence.effect()
            .atLocation(token)
            .file(closest("jb2a.side_impact.part.fast.ice_shard.blue"))
            .rotateTowards(target)
            .scaleToObject(2)
            .randomizeMirrorY()
            .zIndex(2);

        // Cold shudder/shake pulse on struck target token
        sequence.effect()
            .copySprite(target)
            .spriteRotation(-targetRotation)
            .atLocation(target)
            .scaleToObject(1, { considerTokenScale: true })
            .fadeIn(100)
            .fadeOut(100)
            .loopProperty("spriteContainer", "position.x", { from: -0.05, to: 0.05, duration: 175, pingPong: true, gridUnits: true })
            .duration(500)
            .opacity(0.15);
    }

    await sequence.play();
} else {
    // 3. Toggle / Re-entrant Persistent Effect Handling (No targets selected)
    const activeEffects = Sequencer.EffectManager.getEffects({ name: label, object: token });
    const fallbackEffects = Sequencer.EffectManager.getEffects({ name: `${id}*`, object: token });
    const isPlaying = (activeEffects?.length ?? 0) > 0 || (fallbackEffects?.length ?? 0) > 0;

    if (isPlaying) {
        // Stop Routine: Shatter explosion & end active persistent armor cladding
        const stopSequence = new Sequence();
        stopSequence.effect()
            .attachTo(token)
            .file(closest("jb2a.shield.01.outro_explode.blue"))
            .scaleToObject(1.5 * scaleX)
            .opacity(0.75)
            .fadeOut(500)
            .zIndex(1)
            .thenDo(function () {
                Sequencer.EffectManager.endEffects({ name: label, object: token });
                Sequencer.EffectManager.endEffects({ name: `${id}*`, object: token });
            });

        await stopSequence.play();
    } else {
        // Cast Routine: Frosty ice rime shield armor cladding around token
        let sequence = new Sequence();

        // Floor dark purple/blue rune intro
        sequence = sequence.effect()
            .file(closest("jb2a.ward.rune.dark_purple.01"))
            .atLocation(token)
            .scaleToObject(1.85)
            .belowTokens()
            .fadeOut(3000)
            .scaleIn(0, 500, { ease: "easeOutCubic" })
            .filter("ColorMatrix", { brightness: 2, saturate: -0.75, hue: -75 });

        // Blue spell rune activation complete intro
        sequence = sequence.effect()
            .attachTo(token)
            .delay(250)
            .file(closest("jb2a.magic_signs.rune.02.complete.06.blue"))
            .scaleToObject(0.75 * scaleX)
            .scaleIn(0, 500, { ease: "easeOutCubic" })
            .playbackRate(2.5)
            .opacity(1)
            .zIndex(3);

        // Fast inner pulse boundary ring
        sequence = sequence.effect()
            .attachTo(token)
            .file(closest("jb2a.extras.tmfx.border.circle.inpulse.01.fast"))
            .scaleToObject(1.5 * scaleX)
            .opacity(1)
            .zIndex(3);

        // Persistent inflow frost whirl
        sequence = sequence.effect()
            .attachTo(token)
            .name(label)
            .file(closest("jb2a.extras.tmfx.inflow.circle.01"))
            .scaleToObject(1 * scaleX)
            .randomRotation()
            .fadeIn(1500)
            .fadeOut(500)
            .opacity(0.9)
            .zIndex(2)
            .extraEndDuration(1500)
            .private()
            .persist();

        // Persistent outflow frost field below token
        sequence = sequence.effect()
            .attachTo(token)
            .name(label)
            .file(closest("jb2a.extras.tmfx.outflow.circle.01"))
            .scaleToObject(1.35 * scaleX)
            .randomRotation()
            .fadeIn(1500)
            .fadeOut(500)
            .scaleIn(0, 1500, { ease: "easeOutCubic" })
            .belowTokens()
            .opacity(0.9)
            .extraEndDuration(1500)
            .zIndex(1)
            .private()
            .persist();

        // Persistent crystalline snowflake floor emblem
        sequence = sequence.effect()
            .attachTo(token)
            .name(label)
            .file(closest("jb2a.template_circle.symbol.normal.snowflake.blue"))
            .scaleToObject(1.35 * scaleX)
            .randomRotation()
            .fadeIn(1500)
            .fadeOut(500)
            .scaleIn(0, 1500, { ease: "easeOutCubic" })
            .belowTokens()
            .opacity(0.75)
            .extraEndDuration(1500)
            .zIndex(2)
            .private()
            .persist();

        // Persistent blue icy shield orb cladding around token
        sequence = sequence.effect()
            .attachTo(token)
            .name(label)
            .file(closest("jb2a.shield.01.loop.blue"))
            .scaleToObject(1.5 * scaleX)
            .opacity(0.75)
            .fadeIn(1500)
            .fadeOut(500)
            .zIndex(1)
            .persist();

        await sequence.play();
    }
}
