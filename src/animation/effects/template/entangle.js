// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { template as templatelib } from '../../../lib/templates.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';
import { entangled } from '../active-effect/entangled.js';

import { adapter } from "../../../adapters/index.js";
const DEFAULT_CONFIG = {
    id: 'entangle',
    color: 'green',
    template: undefined,
    sound: { ...DEFAULT_SOUND_CONFIG }
};

async function create(token, config = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, color, template, sound } = mConfig;

    const portalEntry = Sequencer.Database.getEntry(closest('eskie.crosshair.rectangle.fantasy_01.white.full.20x20ft'));
    const portalPath = portalEntry?.file ?? portalEntry?.files?.[0] ?? portalEntry;
    const cfg = {
        radius: 20,
        max: 90,
        icon: portalPath,
        label: 'Entangle'
    };

    let [primary, secondary, center] = await templatelib.getPosition(template, cfg);
    if (!center && !primary) return;
    const targetPos = center ?? primary;

    const seq = new Sequence();
    applySound(seq, sound);

    // Casting on token
    seq.effect()
        .name(`${id} - ${token.id}`)
        .file(closest(`eskie.casting.nature.01.side.loop.${color}`))
        .attachTo(token)
        .rotateTowards(targetPos)
        .scaleToObject(1.25, { considerTokenScale: true })
        .spriteOffset({ x: -0.25 }, { gridUnits: true })
        .duration(2000)
        .fadeOut(500);

    // Center casting ring
    seq.effect()
        .name(`${id} - ${token.id}`)
        .file(closest(`eskie.casting.nature.01.center.loop.${color}`))
        .atLocation(targetPos)
        .size(1, { gridUnits: true })
        .belowTokens()
        .duration(2000)
        .fadeOut(500)
        .zIndex(1.1);

    // Persistent area vines
    seq.effect()
        .delay(500)
        .name(`${id} - ${token.id}`)
        .file(closest('eskie.nature.vine.normal.circle.01.physical.green.radius_20ft'))
        .atLocation(targetPos)
        .scaleToObject(1.15)
        .persist()
        .belowTokens()
        .zIndex(1)
        .randomRotation();

    // Conjuration complete magic sign
    seq.effect()
        .name(`${id} - ${token.id}`)
        .atLocation(targetPos)
        .file(closest('jb2a.magic_signs.circle.02.conjuration.complete.dark_green'))
        .size(3.5, { gridUnits: true })
        .fadeIn(600)
        .opacity(1)
        .rotateIn(180, 600, { ease: 'easeOutCubic' })
        .scaleIn(0, 600, { ease: 'easeOutCubic' })
        .belowTokens()
        .fadeOut(500)
        .duration(3000);

    // Persistent faded ground rune
    seq.effect()
        .name(`${id} - ${token.id}`)
        .atLocation(targetPos)
        .file(closest('jb2a.magic_signs.circle.02.conjuration.complete.dark_green'))
        .size(3.5, { gridUnits: true })
        .fadeIn(600, { delay: 2500 })
        .opacity(0.5)
        .rotateIn(180, 600, { ease: 'easeOutCubic' })
        .scaleIn(0, 600, { ease: 'easeOutCubic' })
        .persist()
        .belowTokens()
        .filter('ColorMatrix', { brightness: 0 });

    return seq;
}

async function play(token, config = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

async function stop(token, config = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mConfig;
    Sequencer.EffectManager.endEffects({ name: `${id} - ${token.id}` });
}

export const entangle = {
    create,
    play,
    stop,
    template: {
        create,
        play,
        stop,
        default_config: DEFAULT_CONFIG
    },
    effect: entangled,
    entangled,
    default_config: DEFAULT_CONFIG
};

autorec.register('entangle', 'template', 'eskie.effect.entangle', DEFAULT_CONFIG, '0.0.4', 'Entangle');

