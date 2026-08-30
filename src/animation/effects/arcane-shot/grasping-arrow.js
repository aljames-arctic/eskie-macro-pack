// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'graspingArrow',
    sound: {
        ...DEFAULT_SOUND_CONFIG,
        enable: false,
        file: '',
    },
};

async function create(token, target, config = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { sound } = mConfig;

    if (!target) return;

    const sequence = new Sequence();
    applySound(sequence, sound);

    sequence
        .effect()
            .file(closest('eskie.casting.physical.03.side.one_shot.green'))
            .attachTo(token)
            .rotateTowards(target)
            .scaleToObject(1, { considerTokenScale: true })
            .zIndex(2)
            .waitUntilFinished(-750)

        .effect()
            .file(closest('eskie.attack.ranged.arrow.01.physical.medium.green.normal'))
            .atLocation(token)
            .stretchTo(target)
            .zIndex(2)
            .waitUntilFinished(-750)

        .effect()
            .copySprite(target)
            .attachTo(target)
            .scaleToObject(1, { considerTokenScale: true })
            .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
            .opacity(0.5)
            .duration(1000)
            .fadeOut(250)

        .effect()
            .file(closest('eskie.damage.poison.01.green'))
            .attachTo(target, { bindAlpha: false, bindVisibility: false })
            .scaleToObject(0.95, { considerTokenScale: true })
            .zIndex(1)

        .effect()
            .file(closest('eskie.nature.vine.normal.01.physical.green'))
            .atLocation(target)
            .scaleToObject(1.25, { considerTokenScale: true })
            .zIndex(3)

        .effect()
            .name(`Grasping Arrow ${target.name}`)
            .file(closest('jb2a.plant_growth.04.ring.4x4.pulse.greenwhite'))
            .attachTo(target)
            .scaleToObject(1.25, { considerTokenScale: true })
            .zIndex(1)
            .filter('ColorMatrix', { saturate: 0, hue: -20 })

        .wait(250)

        .effect()
            .name(`Grasping Arrow ${target.name}`)
            .file(closest('eskie.nature.vine.normal.circle.01.physical.green.radius_20ft'))
            .attachTo(target)
            .scaleToObject(1.95, { considerTokenScale: true })
            .randomRotation()
            .zIndex(1)
            .persist()
            .mask()

        .effect()
            .name(`Grasping Arrow ${target.name}`)
            .file(closest('eskie.nature.vine.normal.circle.01.physical.green.radius_10ft'))
            .attachTo(target)
            .scaleToObject(1.45, { considerTokenScale: true })
            .randomRotation()
            .zIndex(1)
            .persist()
            .belowTokens();

    return sequence;
}

async function play(token, target, config = {}) {
    const sequence = await create(token, target, config);
    if (sequence) return sequence.play();
}

async function stop(token, target, config = {}) {
    if (target) {
        Sequencer.EffectManager.endEffects({ name: `Grasping Arrow ${target.name}`, object: target });
    }
}

export const graspingArrow = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autorec.register('graspingArrow', 'ranged-target', 'eskie.effect.arcaneShot.graspingArrow', DEFAULT_CONFIG, '0.0.1', 'Grasping Arrow');
