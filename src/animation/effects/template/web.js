// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { template as templatelib } from '../../../lib/templates.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'web',
    distance: 28.5,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token, config = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { distance, sound, template } = mConfig;

    const cfg = {
        distance,
        label: 'Web',
        icon: token?.document?.texture?.src ?? ''
    };
    let [primary, secondary, center] = await templatelib.getPosition(template, cfg);
    if (!primary && !center) return null;
    const targetPos = center ?? primary;

    const sequence = new Sequence();
    applySound(sequence, sound);
    const label = `${token?.name ?? 'Token'} Web`;

    sequence
        .effect()
            .name(`${label} Casting`)
            .file(closest('eskie.casting.arcane.01.side.loop.yellow'))
            .attachTo(token)
            .rotateTowards(targetPos)
            .scaleToObject(1.25, { considerTokenScale: true })
            .spriteOffset({ x: -0.15 }, { gridUnits: true })
            .persist()

        .effect()
            .name(`${label} Casting`)
            .file(closest('eskie.casting.arcane.01.center.loop.yellow'))
            .atLocation(targetPos)
            .size(1.75, { gridUnits: true })
            .belowTokens()
            .zIndex(1.1)
            .persist()

        .effect()
            .name(label)
            .atLocation(targetPos)
            .file(closest('jb2a.magic_signs.circle.02.conjuration.complete.dark_yellow'))
            .size(3.5, { gridUnits: true })
            .fadeIn(600)
            .opacity(1)
            .rotateIn(180, 600, { ease: 'easeOutCubic' })
            .scaleIn(0, 600, { ease: 'easeOutCubic' })
            .belowTokens()
            .fadeOut(500)
            .duration(3000)

        .effect()
            .name(label)
            .atLocation(targetPos)
            .file(closest('jb2a.magic_signs.circle.02.conjuration.complete.dark_yellow'))
            .size(3.5, { gridUnits: true })
            .fadeIn(600, { delay: 2500 })
            .fadeOut(1000)
            .opacity(0.5)
            .rotateIn(180, 600, { ease: 'easeOutCubic' })
            .scaleIn(0, 600, { ease: 'easeOutCubic' })
            .persist()
            .belowTokens()
            .filter('ColorMatrix', { brightness: 0 })

        .effect()
            .file(closest('jb2a.markers.light_orb.loop.white'))
            .atLocation(targetPos)
            .scaleIn(0, 1500, { ease: 'easeOutCubic' })
            .fadeIn(500)
            .duration(2500)
            .belowTokens()
            .zIndex(2)
            .size(2, { gridUnits: true })

        .effect()
            .file(closest('jb2a.shield_themed.above.eldritch_web.01.dark_green'))
            .atLocation(targetPos)
            .scaleIn(0, 1500, { ease: 'easeOutCubic' })
            .fadeIn(500)
            .duration(2500)
            .belowTokens()
            .zIndex(2.1)
            .size(0.9, { gridUnits: true })
            .opacity(0.5)
            .filter('ColorMatrix', { brightness: 0, saturate: -1 })

        .wait(2250)

        .effect()
            .delay(250)
            .file(closest('jb2a.impact.004.yellow'))
            .atLocation(targetPos)
            .scaleToObject(0.8, { considerTokenScale: true })
            .scaleIn(0, 200, { ease: 'easeOutCubic' })
            .filter('ColorMatrix', { saturate: -1 })

        .thenDo(() => {
            Sequencer.EffectManager.endEffects({ name: `${label} Casting` });
        })

        .effect()
            .name(label)
            .file(closest('blfx.spell.template.square.nature.web.1.color1'))
            .atLocation(targetPos)
            .scaleToObject(1, { considerTokenScale: true })
            .persist()
            .zIndex(1)

        .effect()
            .name(label)
            .file(closest('blfx.spell.template.square.nature.web.2.color1'))
            .atLocation(targetPos)
            .scaleToObject(1, { considerTokenScale: true })
            .persist()
            .opacity(0.5)
            .zIndex(1)
            .belowTokens();

    return sequence;
}

async function play(token, config = {}) {
    const sequence = await create(token, config);
    if (sequence) return sequence.play();
}

function stop(token) {
    const label = `${token?.name ?? 'Token'} Web`;
    Sequencer.EffectManager.endEffects({ name: label });
    Sequencer.EffectManager.endEffects({ name: `${label} Casting` });
}

export const web = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autorec.register('web', 'template', 'eskie.effect.web', DEFAULT_CONFIG, '0.0.1', 'Web');
