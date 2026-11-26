/**
 * fire-blast.js
 * 
 * Original Author: yamiakane (@yamiakane on Discord)
 * Modular Conversion: bakanabaka
 */

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { resolveMotionTarget } from '../../utils/motion.js';

import { adapter } from "../../../adapters/index.js";
const DEFAULT_CONFIG = {
    pushDistance: 80,
    knockbackDuration: 200,
    returnDuration: 600,
    sound: {
        charge: [
            { ...DEFAULT_SOUND_CONFIG, enable: true, volume: 0.5, delay: 200, file: 'blfx.sound.misc.impact.fire1.4' },
            { ...DEFAULT_SOUND_CONFIG, enable: true, volume: 0.5, delay: 500, file: 'blfx.sound.spell.elementalism1.1' },
        ],
        channel: [
            { ...DEFAULT_SOUND_CONFIG, enable: true, volume: 0.5, fadeIn: 200, fadeOut: 500, file: 'blfx.sound.spell.loop_channel.fire_burning1.5' },
            { ...DEFAULT_SOUND_CONFIG, enable: true, volume: 0.5, file: 'blfx.sound.ability.breath.1' },
            { ...DEFAULT_SOUND_CONFIG, enable: true, volume: 0.5, delay: 400, file: 'blfx.sound.misc.shock_wave.2' },
        ],
        attack: {
            ...DEFAULT_SOUND_CONFIG,
            enable: true,
            volume: 0.5,
            file: 'blfx.sound.spell.cast.fire.1'
        },
        sacredFlame: {
            ...DEFAULT_SOUND_CONFIG,
            enable: true,
            volume: 0.5,
            file: 'blfx.sound.spell.sacred_flame1.impact.2'
        },
        burningHands: [
            { ...DEFAULT_SOUND_CONFIG, enable: true, volume: 0.5, file: 'blfx.sound.spell.cast.burning_hands.2' },
            { ...DEFAULT_SOUND_CONFIG, enable: true, volume: 0.5, file: 'blfx.sound.spell.cast.fireball.4' },
        ],
        fireball: [
            { ...DEFAULT_SOUND_CONFIG, enable: true, volume: 0.5, file: 'blfx.sound.spell.cast.fireball.2' },
            { ...DEFAULT_SOUND_CONFIG, enable: true, volume: 0.5, delay: 200, file: 'blfx.sound.misc.fire.throw.1' },
        ]
    },
};

async function create(source: Token, target: Token, config: any = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { pushDistance, knockbackDuration, returnDuration, sound } = mConfig;

    const sequence = new Sequence();

    const sourceCenter = adapter.getCenter(source);
    const targetCenter = adapter.getCenter(target);
    const dx = targetCenter.x - sourceCenter.x;
    const dy = targetCenter.y - sourceCenter.y;
    const dist = Math.hypot(dx, dy);

    if (dist === 0) return sequence;

    const gridSize = adapter.getGridSize();
    const nx = dx / dist;
    const ny = dy / dist;
    const nxt = -nx;
    const nyt = -ny;
    const kbDuration = Math.max(1, knockbackDuration);
    const retDuration = Math.max(1, returnDuration);
    const motionSource = resolveMotionTarget(source);
    const motionTarget = resolveMotionTarget(target);

    // --- Charging Phase ---
    applySound(sequence, sound.charge);

    sequence.effect()
        .file(closest('jb2a.divine_smite.caster.standard.orange'))
        .atLocation(source)
        .scaleToObject(0.5, { considerTokenScale: true })
        .playbackRate(1.6)
        .aboveInterface()
        .waitUntilFinished(-500);

    sequence.effect()
        .file(closest('jb2a.lightning_orb.01.loop.bluepurple'))
        .filter('ColorMatrix', { hue: 90, contrast: 1.5 })
        .tint('#e6a900')
        .attachTo(source)
        .scaleToObject(0.3, { considerTokenScale: true })
        .duration(2500) // Replaced persist() with duration for one-shot attack
        .fadeIn(200)
        .fadeOut(400)
        .aboveInterface()
        .animateProperty('spriteContainer', 'position.x', { from: 0, to: 0.5, duration: 1200, gridUnits: true, ease: 'easeInOutQuad' })
        .loopProperty('spriteContainer', 'rotation', { from: 0, to: 360, duration: 2000, ease: 'linear' })
        .loopProperty('sprite', 'rotation', { from: 0, to: 360, duration: 2000, ease: 'linear' });

    sequence.effect()
        .file(closest('blfx.spell.template.circle.emanating.aura3.loop.radial.color5'))
        .filter('ColorMatrix', { hue: 30, saturate: 2 })
        .fadeIn(500)
        .fadeOut(300)
        .attachTo(source)
        .duration(2500)
        .scaleToObject(0.33, { considerTokenScale: true })
        .opacity(0.6)
        .belowTokens();

    applySound(sequence, sound.channel);

    sequence.effect()
        .file(closest('blfx.spell.cast.swirl1.fire1.loop.orange'))
        .scaleToObject(0.2, { considerTokenScale: true })
        .fadeIn(600)
        .fadeOut(600)
        .attachTo(source)
        .belowTokens()
        .duration(2500)
        .waitUntilFinished(-1000);

    // --- Final Attack Phase ---
    sequence.effect()
        .file(closest('jb2a.ranged_helix.hit.001.orangeyellow'))
        .scaleToObject(0.6, { considerTokenScale: true })
        .atLocation(source)
        .randomRotation()
        .belowTokens();

    applySound(sequence, sound.attack);

    sequence.effect()
        .file(closest('jb2a.ranged_helix.cast.001.orangeyellow'))
        .atLocation(source)
        .scaleToObject(0.6, { considerTokenScale: true })
        .spriteOffset({ x: -1.8 }, { gridUnits: true })
        .rotateTowards(target)
        .belowTokens()
        .waitUntilFinished(-1850);

    applySound(sequence, sound.sacredFlame);

    sequence.effect()
        .file(closest('jb2a.on_token_buff.001.003.orangeyellow'))
        .atLocation(source)
        .scaleToObject(0.5, { considerTokenScale: true });

    applySound(sequence, sound.burningHands);

    sequence.effect()
        .file(closest('jb2a.ranged_missile.cast.001.orangeyellow'))
        .atLocation(source)
        .scaleToObject(0.5, { considerTokenScale: true })
        .spriteOffset({ x: -75 })
        .rotateTowards(target)
        .waitUntilFinished(-1000);

    // Source Recoil
    if (motionSource) {
        sequence.motion(motionSource)
            .moveBy(
                { x: nxt * gridSize * 0.2, y: nyt * gridSize * 0.2 },
                {
                    delay: 100,
                    duration: kbDuration,
                    ease: 'easeOutExpo',
                    returnDuration: retDuration,
                    easeOut: 'easeInQuart',
                }
            );
    }

    // Projectile
    sequence.effect()
        .file(closest('jb2a.ranged.04.projectile.01.orange'))
        .tint('#fce703')
        .atLocation(source)
        .stretchTo(target)
        .opacity(1)
        .waitUntilFinished(-1000);

    applySound(sequence, sound.fireball);

    // Impact
    sequence.effect()
        .file(closest('jb2a.explosion.01.orange'))
        .atLocation(target)
        .scaleToObject(0.6, { considerTokenScale: true })
        .opacity(1)
        .zIndex(2);

    // Target Knockback
    if (motionTarget) {
        sequence.motion(motionTarget)
            .zIndex(1)
            .moveBy(
                { x: nx * pushDistance * 0.15, y: ny * pushDistance * 0.15 },
                {
                    duration: kbDuration,
                    ease: 'easeOutExpo',
                    returnDuration: retDuration,
                    easeOut: 'easeInQuart',
                }
            );
    }

    return sequence;
}

async function play(source: Token, target: Token, config: any = {}) {
    const sequence = await create(source, target, config);
    if (sequence) return sequence.play();
}

function stop(target: Token, config: any = {}) {
    // This animation is one-shot
}

export const fireBlast = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

adapter.autorec.register("fireBlast", 'ranged-target', 'eskie.effect.fireBlast', DEFAULT_CONFIG, '0.1.1', "Fire Blast");
