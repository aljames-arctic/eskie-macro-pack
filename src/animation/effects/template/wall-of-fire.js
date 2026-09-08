// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { template as templatelib } from '../../../lib/templates.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'wallOfFire',
    distance: 60,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token, config = {}, options = {}) {
    if (options?.type == "aefx") return;
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { sound, template, distance: configDistance } = mConfig;

    const tokenImg = token?.document?.texture?.src ?? 'icons/svg/fire.svg';
    const cfg = {
        type: 'ray',
        distance: configDistance ?? 60,
        icon: tokenImg,
        label: 'Wall of Fire',
    };

    const [primary, secondary, center] = await templatelib.getPosition(template, cfg);
    if (!primary && !center) return null;

    const position1 = primary ?? center;
    const position2 = secondary ?? (position1 ? { x: position1.x + (configDistance ?? 60) * 10, y: position1.y } : null);
    if (!position1 || !position2) return null;

    const tokenName = token.name;
    const gridSize = adapter.getGridSize();
    const stepSize = gridSize / 2;
    const effectPoints = adapter.getInterpolatedPoints(position1, position2, stepSize);
    const midpoint = {
        x: (position1.x + position2.x) / 2,
        y: (position1.y + position2.y) / 2,
    };

    let castingFlip;
    if (Math.abs(position1.x - position2.x) > Math.abs(position1.y - position2.y)) {
        castingFlip = position1.x < position2.x;
    } else {
        castingFlip = position1.y > position2.y;
    }

    const tokenCenter = adapter.getCenter(token);
    if (midpoint.x < tokenCenter.x || midpoint.y < tokenCenter.y) {
        castingFlip = !castingFlip;
    }

    const wallFiles = {
        '05ft': closest('modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_10ft_400x400.webm'),
        '15ft': closest('modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_20ft_800x400.webm'),
        '30ft': closest('modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_30ft_1200x400.webm'),
        '60ft': closest('modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_60ft_2400x400.webm'),
        '90ft': closest('modules/boss-loot-assets-premium/artwork/05-spell/level4/wallOfFire/Firewall_1_ORANGE_TEMPLATE_60ft_2400x400.webm'),
    };

    const sequence = new Sequence();
    applySound(sequence, sound);

    for (let e = 0; e <= effectPoints.length - 1; e += 2) {
        const starSeq = new Sequence()
            .effect()
                .atLocation(effectPoints[e], { offset: { y: 0 }, randomOffset: 0.5, gridUnits: true })
                .file(closest('eskie.star.03.orange'))
                .size(Math.random() * 1.5 + 1, { gridUnits: true })
                .randomizeMirrorX()
                .filter('ColorMatrix', { saturate: 1, hue: -5 })
                .randomRotation()
                .zIndex(1);

        sequence.addSequence(starSeq);
    }

    sequence
        .wait(750)
        .effect()
            .file(closest('jb2a.cast_generic.fire.01.orange'))
            .attachTo(token)
            .scaleToObject(2.25, { considerTokenScale: true })
            .belowTokens()
            .scaleOut(0, 1500, { ease: 'easeOutCubic' })
            .zIndex(2)

        .effect()
            .file(closest('jb2a.melee_generic.slash.02.001.orange.2'))
            .atLocation(token)
            .rotateTowards(midpoint)
            .scaleToObject(2, { considerTokenScale: true })
            .playbackRate(0.8)
            .spriteOffset({ x: -0.65 }, { gridUnits: true })
            .spriteScale({ y: 1.75 })
            .mirrorY(castingFlip)

        .effect()
            .delay(150)
            .file(closest('blfx.spell.template.line.crack1.ground1.orange'))
            .atLocation(position1, { offset: { x: -1 }, gridUnits: true, local: true })
            .stretchTo(position2, { offset: { x: 1 }, gridUnits: true, onlyX: false, local: true })
            .belowTokens();

    for (let e = 0; e <= effectPoints.length - 1; e++) {
        const flameSeq = new Sequence()
            .effect()
                .atLocation(effectPoints[e], { offset: { y: -1 }, gridUnits: true })
                .file(closest('jb2a.flames.02.orange'))
                .size({ width: 2, height: 1.5 }, { gridUnits: true })
                .duration(1000)
                .fadeIn(200)
                .fadeOut(800)
                .animateProperty('sprite', 'height', { from: 1.5, to: Math.random() + 1.75, duration: 500, gridUnits: true, ease: 'easeOutBack' })
                .randomizeMirrorX()
                .zIndex(1);

        if (e % 2 === 0) {
            flameSeq.effect()
                .name(`${tokenName} Wall of Fire`)
                .delay(50, 750)
                .atLocation(effectPoints[e], { offset: { y: -0.35 }, randomOffset: 0.15, gridUnits: true })
                .file(closest('eskie.particle.01.loop.orange'))
                .size({ width: 2, height: 1 }, { gridUnits: true })
                .animateProperty('sprite', 'height', { from: 1.5, to: Math.random() + 1.75, duration: 500, gridUnits: true, ease: 'easeOutBack' })
                .randomizeMirrorX()
                .persist()
                .zIndex(1);
        }

        sequence.addSequence(flameSeq);
    }

    sequence
        .effect()
            .name(`${tokenName} Wall of Fire`)
            .file(wallFiles)
            .atLocation(position1, { offset: { x: -0.5 }, gridUnits: true, local: true })
            .stretchTo(position2, { offset: { x: 0.5 }, gridUnits: true, local: true })
            .scale(1)
            .animateProperty('sprite', 'height', { from: -1, to: 0, duration: 250, ease: 'easeOutBack', gridUnits: true })
            .fadeIn(250)
            .persist();

    return sequence;
}

async function play(token, config = {}, options = {}) {
    if (options?.type == "aefx") return;
    const sequence = await create(token, config, options);
    if (sequence) return sequence.play();
}

function stop(token, { id = DEFAULT_CONFIG.id } = {}) {
    if (token) {
        const tokenName = token.name;
        Sequencer.EffectManager.endEffects({ name: `${tokenName} Wall of Fire` });
        Sequencer.EffectManager.endEffects({ name: `${tokenName} Wall of Fire ${id}` });
        Sequencer.EffectManager.endEffects({ name: `${tokenName} Wall Fire Crosshair` });
    }
}

export const wallOfFire = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autorec.register('wallOfFire', 'template', 'eskie.effect.wallOfFire', DEFAULT_CONFIG, '0.0.2', 'Wall of Fire');
