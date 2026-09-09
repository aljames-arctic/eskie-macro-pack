// Original Author: .eskie / EskieMoh#2969
// Updater: @bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    id: 'eyesOfNight',
    darkMap: true,
    sound: { ...DEFAULT_SOUND_CONFIG }
};

async function create(token: Token, targets: Token[] = [], config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, darkMap, sound } = mConfig;

    const targetList = [targets].flat().filter(Boolean);

    const allPoints = [
        adapter.getCenter(token),
        ...targetList.map(t => adapter.getCenter(t))
    ];

    const minX = Math.min(...allPoints.map(p => p.x));
    const maxX = Math.max(...allPoints.map(p => p.x));
    const minY = Math.min(...allPoints.map(p => p.y));
    const maxY = Math.max(...allPoints.map(p => p.y));

    const centerPoint = {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2
    };

    const sequence = new Sequence();
    applySound(sequence, sound);

    const bg = adapter.getSceneBackground(canvas?.scene);
    if (darkMap && bg?.src) {
        const dims = adapter.getSceneDimensions(canvas?.scene);
        sequence.effect()
            .name(`${id} - ${token.id}`)
            .file(closest(bg.src))
            .filter('ColorMatrix', { brightness: 0 })
            .atLocation(adapter.getSceneCenter(canvas?.scene))
            .size({ width: dims.width / dims.size, height: dims.height / dims.size }, { gridUnits: true })
            .spriteOffset({ x: -bg.offsetX, y: -bg.offsetY })
            .duration(4000)
            .fadeIn(750)
            .fadeOut(750)
            .belowTokens()
            .opacity(0.5);
    }

    sequence.effect()
        .file(closest('jb2a.healing_generic.03.burst.bluepurple'))
        .attachTo(token)
        .scaleToObject(2.2, { considerTokenScale: true })
        .fadeIn(500)
        .fadeOut(1000)
        .opacity(1)
        .belowTokens()
        .startTime(1000)
        .filter('ColorMatrix', { saturate: -0.5, hue: -50 })
        .zIndex(1);

    sequence.effect()
        .file(closest('eskie.symbol.eye.01.blue'))
        .attachTo(token)
        .scaleToObject(0.65, { considerTokenScale: true })
        .filter('ColorMatrix', { saturate: -1 });

    sequence.effect()
        .file(closest('eskie.symbol.constellation.symbol_only.01.moon.white'))
        .atLocation(centerPoint)
        .scaleToObject(6)
        .fadeIn(1000)
        .filter('ColorMatrix', { brightness: 0 })
        .opacity(0.5)
        .duration(4500)
        .fadeOut(1000)
        .belowTokens()
        .zIndex(0);

    let source = token;
    const remaining = [...targetList];

    while (remaining.length > 0) {
        let closestIndex = 0;
        let closestDistance = Infinity;

        const sourceCenter = adapter.getCenter(source);
        for (let i = 0; i < remaining.length; i++) {
            const tCenter = adapter.getCenter(remaining[i]);
            const dist = Math.hypot(tCenter.x - sourceCenter.x, tCenter.y - sourceCenter.y);
            if (dist < closestDistance) {
                closestDistance = dist;
                closestIndex = i;
            }
        }

        const target = remaining.splice(closestIndex, 1)[0];
        const scale = closestDistance <= adapter.getGridSize() ? 1 : 0.5;

        const chainSeq = new Sequence()
            .effect()
            .file(closest('eskie.star.constellation.line.01.white'))
            .attachTo(source)
            .stretchTo(target, { onlyX: false, attachTo: true })
            .scale(scale)
            .template({ gridSize: 200, startPoint: -100, endPoint: 100 })
            .randomizeMirrorY()
            .effect()
            .delay(250)
            .file(closest('jb2a.healing_generic.03.burst.bluepurple'))
            .attachTo(target)
            .scaleToObject(2.2, { considerTokenScale: true })
            .fadeIn(500)
            .fadeOut(1000)
            .opacity(1)
            .belowTokens()
            .startTime(1000)
            .filter('ColorMatrix', { saturate: -0.5, hue: -50 })
            .zIndex(1)
            .wait(250);

        sequence.addSequence(chainSeq);
        source = target;
    }

    return sequence;
}

async function play(token: Token, targets: Token[] = [], config: any = {}) {
    const seq = await create(token, targets, config);
    if (seq) return seq.play();
}

async function createEffect(token: Token, config: any = {}) {
    return create(token, [], config);
}

async function playEffect(token: Token, config: any = {}) {
    const seq = await createEffect(token, config);
    if (seq) return seq.play();
}

async function stop(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mConfig;
    Sequencer.EffectManager.endEffects({ name: `${id} - ${token.id}` });
}

export const eyesOfNight = {
    create,
    play,
    stop,
    target: {
        create,
        play,
        default_config: DEFAULT_CONFIG
    },
    effect: {
        create: createEffect,
        play: playEffect,
        default_config: DEFAULT_CONFIG
    },
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register('eyesOfNight', 'ranged-target', 'eskie.effect.eyesOfNight.target', DEFAULT_CONFIG, '0.0.1', 'Eyes of Night');
adapter.autorec.register('eyesOfNight', 'effect', 'eskie.effect.eyesOfNight.effect', DEFAULT_CONFIG, '0.0.1', 'Eyes of Night');
