// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { template as templatelib } from '../../../lib/templates.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';


const DEFAULT_CONFIG = {
    id: 'cloudkill',
    radius: 20,
    tintMap: true,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token, config = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { radius, tintMap, sound, template } = mConfig;

    const cfg = {
        radius,
        label: 'Cloudkill',
        icon: token?.document?.texture?.src ?? ''
    };
    let [primary, secondary, center] = await templatelib.getPosition(template, cfg);
    if (!primary && !center) return null;
    const targetPos = center ?? primary;

    const sequence = new Sequence();
    applySound(sequence, sound);
    const bgSrc = adapter.getSceneBackground(canvas?.scene);
    const sceneDimensions = canvas?.dimensions ?? { width: 4000, height: 4000 };
    const gridSize = canvas?.grid?.size ?? 100;
    const sceneWidth = canvas?.scene?.width ?? 4000;
    const sceneHeight = canvas?.scene?.height ?? 4000;
    const tokenName = token?.name ?? 'Token';

    if (tintMap && bgSrc) {
        sequence
            .effect()
                .name(`Casting ${tokenName}`)
                .file(bgSrc)
                .atLocation({ x: sceneDimensions.width / 2, y: sceneDimensions.height / 2 })
                .size({ width: sceneWidth / gridSize, height: sceneHeight / gridSize }, { gridUnits: true })
                .persist()
                .fadeIn(1000, { ease: 'easeOutCubic' })
                .fadeOut(3000)
                .filter('ColorMatrix', { brightness: 0 })
                .belowTokens()
                .opacity(0.5);
    }

    sequence
        .effect()
            .file(closest('eskie.smoke.07.green'))
            .atLocation(targetPos)
            .scaleIn(0, 500, { ease: 'easeOutCubic' })
            .scaleToObject(1.5, { considerTokenScale: true })
            .opacity(0.1)

        .effect()
            .file(closest('jb2a.extras.tmfx.outflow.circle.01'))
            .atLocation(targetPos)
            .scaleToObject(0.75, { considerTokenScale: true })
            .fadeIn(250)
            .fadeOut(750, { ease: 'easeOutCubic' })
            .duration(2100)
            .opacity(0.1)
            .belowTokens()
            .tint('#94d123')
            .randomRotation()

        .effect()
            .file(closest('eskie.star.03.green'))
            .atLocation(targetPos)
            .size({ width: 2.5, height: 2.5 }, { gridUnits: true })

        .wait(500)

        .effect()
            .file(closest('eskie.poison.circle.01.green'))
            .atLocation(targetPos)
            .scaleToObject(1.1, { considerTokenScale: true })

        .effect()
            .name(`Cloudkill ${tokenName}`)
            .file(closest('jb2a.fog_cloud.02.green'))
            .atLocation(targetPos)
            .scaleToObject(1, { considerTokenScale: true })
            .opacity(0.35)
            .fadeIn(3000)
            .scaleIn(0.25, 2500, { ease: 'easeOutSine' })
            .persist()
            .zIndex(1)

        .wait(5000)

        .thenDo(function() {
            Sequencer.EffectManager.endEffects({ name: `Casting ${tokenName}` });
        });

    return sequence;
}

async function play(token, config = {}) {
    const sequence = await create(token, config);
    if (sequence) return sequence.play({ preload: true });
}

function stop(token) {
    const tokenName = token?.name ?? 'Token';
    Sequencer.EffectManager.endEffects({ name: `Cloudkill ${tokenName}` });
    Sequencer.EffectManager.endEffects({ name: `Casting ${tokenName}` });
}

export const cloudkill = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autorec.register('cloudkill', 'template', 'eskie.effect.cloudkill', DEFAULT_CONFIG, '0.0.1', 'Cloudkill');
