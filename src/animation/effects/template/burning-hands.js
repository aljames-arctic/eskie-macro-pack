// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { settingsOverride } from '../../../lib/settings.js';
import { adapter } from '../../../adapters/index.js';
import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { template as templatelib } from '../../../lib/templates.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'burningHands',
    angle: 53.13,
    coneSize: 'thin', // 'thin', 'wide'
    distance: 15,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

async function create(token, config = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { angle, coneSize, distance, sound, template } = mConfig;

    let position = null;
    if (template) {
        const [primary, secondary, center] = await templatelib.getPosition(template);
        position = center ?? primary;
    }

    const tokenWidth = token?.document?.width ?? token?.width ?? 1;
    const tokenOffset = (tokenWidth - 1) / 2;

    const sequence = new Sequence();
    applySound(sequence, sound);

    if (!position) {
        sequence
            .crosshair('position')
                .type('cone')
                .location(token, { lockToEdge: true, lockToEdgeDirection: true })
                .distance(distance)
                .angle(angle)
                .borderColor('#ffffff', { alpha: 0 })
                .fillColor('#000000', { alpha: 0.1 })
                .icon(token?.document?.texture?.src ?? '')
                .callback(Sequencer.Crosshair.CALLBACKS.SHOW, function(crosshair) {
                    new Sequence()
                        .wait(50)
                        .effect()
                            .name('Cone Crosshair')
                            .file(closest(`eskie.crosshair.cone.${coneSize}.fantasy_01.white.full`))
                            .attachTo(crosshair)
                            .stretchTo(crosshair, { attachTo: true })
                            .opacity(0.8)
                            .belowTokens()
                            .locally()
                            .persist()
                        .play();
                })
                .callback(Sequencer.Crosshair.CALLBACKS.PLACED, function() {
                    Sequencer.EffectManager.endEffects({ name: 'Cone Crosshair' });
                })
                .callback(Sequencer.Crosshair.CALLBACKS.CANCEL, function() {
                    Sequencer.EffectManager.endEffects({ name: 'Cone Crosshair' });
                });
    }

    const targetPos = position ?? 'position';
    const label = `${token?.name ?? 'Token'} Burning Hands`;

    sequence
        .effect()
            .file(closest('jb2a.energy_strands.in.yellow.01'))
            .attachTo(token)
            .rotateTowards(targetPos, { attachTo: true })
            .size(1, { gridUnits: true })
            .spriteScale({ x: 0.75, y: 1.25 })
            .spriteOffset({ x: 0.1 + tokenOffset }, { gridUnits: true })
            .playbackRate(1.5)
            .filter('ColorMatrix', { saturate: 0.5, hue: 0 })
            .waitUntilFinished(-350)

        .effect()
            .file(closest('jb2a.template_line_piercing.generic.01.orange'))
            .attachTo(token)
            .rotateTowards(targetPos, { attachTo: true })
            .size({ width: 1, height: 0.25 }, { gridUnits: true })
            .spriteOffset({ x: 0.35 + tokenOffset, y: 0 }, { gridUnits: true })
            .spriteScale({ x: 1.25 })
            .filter('ColorMatrix', { saturate: 0.5, hue: 10 })
            .spriteRotation(-180)
            .zIndex(1)
            .waitUntilFinished()

        .effect()
            .file(closest('jb2a.impact.010.orange'))
            .attachTo(token)
            .rotateTowards(targetPos)
            .size(1, { gridUnits: true })
            .spriteScale({ x: 0.75, y: 1.25 })
            .spriteOffset({ x: 0.1 + tokenOffset }, { gridUnits: true })
            .playbackRate(1.5)
            .filter('ColorMatrix', { saturate: 0.5, hue: 0 })

        .effect()
            .file(closest('eskie.star.03.orange'))
            .attachTo(token)
            .rotateTowards(targetPos)
            .size(2.5, { gridUnits: true })
            .spriteOffset({ x: -0.8 + tokenOffset }, { gridUnits: true })
            .spriteRotation(90)
            .playbackRate(1.5)
            .filter('ColorMatrix', { saturate: 0.5, hue: 0 })
            .zIndex(2)

        .effect()
            .file(closest('eskie.particle.02.orange'))
            .attachTo(token)
            .rotateTowards(targetPos, { attachTo: true })
            .spriteOffset({ x: -0.9 + tokenOffset }, { gridUnits: true })
            .size(1.5, { gridUnits: true })
            .fadeIn(250)
            .fadeOut(500)
            .zIndex(1)

        .effect()
            .name(label)
            .file(closest('eskie.smoke.04.black'))
            .attachTo(token)
            .rotateTowards(targetPos, { attachTo: true })
            .spriteOffset({ x: -1.55 + tokenOffset }, { gridUnits: true })
            .size(2.5, { gridUnits: true })
            .opacity(0.8)
            .persist()

        .effect()
            .file(closest('jb2a.burning_hands.02.orange'))
            .attachTo(token, { offset: { x: 0.35 + tokenOffset }, gridUnits: true, local: true })
            .stretchTo(targetPos, { attachTo: true })
            .zIndex(1)
            .waitUntilFinished(-1400)

        .thenDo(function() {
            if (token) {
                Sequencer.EffectManager.endEffects({ name: label, object: token });
            }
        });

    return sequence;
}

async function play(token, config = {}) {
    const sequence = await create(token, config);
    if (sequence) return sequence.play({ preload: true });
}

function stop(token) {
    if (token) {
        Sequencer.EffectManager.endEffects({ name: `${token.name} Burning Hands`, object: token });
    }
}

export const burningHands = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};

autorec.register('burningHands', 'template', 'eskie.effect.burningHands', DEFAULT_CONFIG, '0.0.1', 'Burning Hands');
