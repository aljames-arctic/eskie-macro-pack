// Original Author: .eskie
// Modular Conversion: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'twilightSanctuary',
    darkMap: true,
    radius: 30,
    sound: { ...DEFAULT_SOUND_CONFIG }
};

async function create(token: any, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, darkMap, sound } = mConfig;

    if (!token) return;

    const label = `${id} - ${token.id}`;
    const seq = new Sequence();
    applySound(seq, sound);

    const bg = adapter.getSceneBackground(canvas?.scene);
    if (darkMap && bg?.src) {
        const sceneDims = adapter.getSceneDimensions(canvas?.scene);
        const gridSize = adapter.getGridSize(canvas?.scene);
        seq.effect()
            .name(label)
            .file(closest(bg.src))
            .atLocation(adapter.getSceneCenter(canvas?.scene))
            .size({ width: sceneDims.width / gridSize, height: sceneDims.height / gridSize }, { gridUnits: true })
            .fadeIn(750)
            .fadeOut(750)
            .duration(4000)
            .filter('ColorMatrix', { brightness: 0 })
            .belowTokens()
            .persist()
            .opacity(0.5)
            .spriteOffset({ x: -bg.offsetX, y: -bg.offsetY });
    }

    seq.wait(250);

    seq.effect()
        .name(label)
        .file(closest('jb2a.markers.light_orb.complete.white'))
        .attachTo(token)
        .scaleToObject(0.65, { considerTokenScale: true })
        .persist();

    seq.effect()
        .file(closest('jb2a.energy_strands.in.blue'))
        .attachTo(token)
        .scaleToObject(2.5, { considerTokenScale: true })
        .filter('ColorMatrix', { brightness: 0 })
        .belowTokens()
        .opacity(0.8)
        .playbackRate(1.2);

    seq.wait(1000);

    seq.effect()
        .file(closest('eskie.pulse.energy.01.yellow'))
        .attachTo(token, { offset: { x: 0 }, gridUnits: true })
        .scaleToObject(0.7, { gridUnits: true })
        .filter('ColorMatrix', { saturate: -1 })
        .zIndex(1);

    seq.effect()
        .file(closest('eskie.pulse.energy.01.yellow'))
        .attachTo(token, { offset: { x: 0 }, gridUnits: true })
        .scaleToObject(13.5, { gridUnits: true })
        .filter('ColorMatrix', { saturate: -1 })
        .zIndex(1);

    seq.effect()
        .file(closest('jb2a.healing_generic.03.burst.bluepurple'))
        .attachTo(token)
        .scaleToObject(3, { considerTokenScale: true })
        .fadeIn(500)
        .fadeOut(1000)
        .opacity(1)
        .belowTokens()
        .startTime(1000)
        .filter('ColorMatrix', { saturate: -0.5, hue: -50 })
        .zIndex(2);

    seq.effect()
        .name(label)
        .file(closest('jb2a.particles.outward.white.02.03'))
        .attachTo(token)
        .size(2, { gridUnits: true })
        .persist()
        .belowTokens()
        .zIndex(3);

    seq.effect()
        .name(label)
        .file(closest('eskie.aura.twilight.02.black'))
        .attachTo(token, { bindRotation: false })
        .size(13, { gridUnits: true })
        .belowTokens()
        .opacity(1)
        .zIndex(2)
        .filter('ColorMatrix', { hue: -125 })
        .persist();

    return seq;
}

async function play(token: any, config: any = {}) {
    const seq = await create(token, config);
    if (seq) return seq.play();
}

async function stop(token: any, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mConfig;
    if (token) Sequencer.EffectManager.endEffects({ name: `${id} - ${token.id}` });
}

export const twilightSanctuary = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('twilightSanctuary', 'aura', 'eskie.effect.twilightSanctuary', DEFAULT_CONFIG, '0.0.1', 'Twilight Sanctuary');
adapter.autorec.register('channelDivinityTwilightSanctuary', 'aura', 'eskie.effect.twilightSanctuary', DEFAULT_CONFIG, '0.0.1', 'Channel Divinity: Twilight Sanctuary');
adapter.autorec.register(adapter.autorec.CONCENTRATING('twilightSanctuary', 'Twilight Sanctuary'), 'effect', 'eskie.effect.twilightSanctuary', DEFAULT_CONFIG, "0.0.1");
