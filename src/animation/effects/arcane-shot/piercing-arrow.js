// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { template as templatelib } from '../../../lib/templates.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'piercingArrow',
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token, targetOrConfig, config = {}) {
    const isTarget = Boolean(targetOrConfig?.document || targetOrConfig?.center || targetOrConfig?.x);
    const target = isTarget ? targetOrConfig : null;
    const rawConfig = settingsOverride(isTarget ? config : (targetOrConfig ?? config));
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, rawConfig);
    const { sound, template } = mConfig;

    let position = null;
    if (template) {
        const [primary, secondary, center] = await templatelib.getPosition(template);
        position = center ?? primary;
    } else if (target?.center || (target?.x !== undefined && target?.y !== undefined)) {
        position = target.center ?? target;
    } else {
        const crosshairConfig = {
            type: 'ray',
            distance: 30,
            width: 5,
            icon: token?.document?.texture?.src ?? '',
            label: 'Piercing Arrow',
            location: { obj: token, lockToEdge: true },
        };
        position = await Sequencer.Crosshair.show(crosshairConfig);
        if (!position || position.cancelled) return null;
    }

    const sequence = new Sequence();
    applySound(sequence, sound);

    const tokenWidth = token?.document?.width ?? token?.width ?? 1;

    sequence
        .effect()
            .file(closest('eskie.velocity.02.white'))
            .atLocation(token)
            .rotateTowards(position)
            .size(tokenWidth * 2, { gridUnits: true })
            .spriteOffset({ x: -1 }, { gridUnits: true })
            .tint('#ecc432')
            .opacity(0.85)
            .fadeIn(500)

        .effect()
            .file(closest('jb2a.energy_strands.in.green.01'))
            .atLocation(token)
            .rotateTowards(position)
            .size(tokenWidth * 2, { gridUnits: true })
            .spriteScale({ x: 0.75 })
            .spriteOffset({ x: -0.3 }, { gridUnits: true })
            .playbackRate(1.5)
            .waitUntilFinished()

        .effect()
            .file(closest('eskie.star.02.yellow'))
            .atLocation(token)
            .rotateTowards(position)
            .scaleToObject(1, { considerTokenScale: true })
            .spriteOffset({ x: -0.1 }, { gridUnits: true })

        .wait(250)

        .effect()
            .file(closest('eskie.attack.ranged.arrow.ray.physical.green'))
            .atLocation(token)
            .stretchTo(position)
            .scale(2)
            .zIndex(2);

    const hitTargets = mConfig.targets?.length
        ? mConfig.targets
        : (Array.from(game.user?.targets ?? []));

    for (let i = 0; i < hitTargets.length; i++) {
        const t = hitTargets[i];
        const targetSeq = new Sequence()
            .wait(1 + i * 50)
            .effect()
                .copySprite(t)
                .attachTo(t)
                .scaleToObject(1, { considerTokenScale: true })
                .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
                .opacity(0.5)
                .duration(1000)
                .fadeOut(250)
            .effect()
                .file(closest('eskie.damage.piercing.01.yellow'))
                .attachTo(t, { bindAlpha: false, bindVisibility: false })
                .scaleToObject(1.5, { considerTokenScale: true })
                .zIndex(1);

        sequence.addSequence(targetSeq);
    }

    return sequence;
}

async function play(token, targetOrConfig, config = {}) {
    const sequence = await create(token, targetOrConfig, config);
    if (sequence) return sequence.play();
}

function stop() {
    Sequencer.EffectManager.endEffects({ name: 'Ray Crosshair' });
}

export const piercingArrow = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autorec.register('piercingArrow', 'template', 'eskie.effect.arcaneShot.piercingArrow', DEFAULT_CONFIG, '0.0.1', 'Piercing Arrow');
autorec.register('piercingArrow', 'ranged-target', 'eskie.effect.arcaneShot.piercingArrow', DEFAULT_CONFIG, '0.0.1', 'Piercing Arrow');
