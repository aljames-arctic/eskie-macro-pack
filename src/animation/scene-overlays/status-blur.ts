// Original author: Gornetron
// Updates by: Bakana

import { log } from '../../lib/logger.js';
import { adapter } from '../../adapters/index.js';

const DEFAULT_CONFIG = {
    id: 'drunken-blur',
    opacity: 1,
    blur: 3,
    sway: 1,
    durationX: 7000,
    durationY: 11000,
};

function createUserBlur(user: any, bg: any, config: any = {}) {
    const { id, opacity, blur, sway, durationX, durationY } = adapter.mergeObject(DEFAULT_CONFIG, config);

    const sceneCenter = adapter.getSceneCenter(canvas?.scene);
    const sceneDims = adapter.getSceneDimensions(canvas?.scene);
    const drift = (sceneDims.size / 8) * sway;

    const seq = new Sequence();
    seq.effect()
        .name(`${id} - ${user.name}`)
        .file(bg.src)
        .atLocation(sceneCenter)
        .size({
            width: sceneDims.sceneRect.width,
            height: sceneDims.sceneRect.height
        })
        .belowTokens()
        .belowTiles()
        .filter("Blur", { blurX: blur, blurY: blur })
        .opacity(opacity)
        .loopProperty('spriteContainer', 'position.x', { from: -drift, to: drift, duration: durationX, pingPong: true })
        .loopProperty('spriteContainer', 'position.y', { from: -drift, to: drift, duration: durationY, pingPong: true })
        .forUsers(user.id)
        .persist();
    return seq;
}

function create(users: any[] = [], config: any = {}) {
    const seq = new Sequence();
    const bg = adapter.getSceneBackground(canvas?.scene);
    if (!bg?.src) {
        log.warn('Scene background texture not set. Background blurring failed');
        return seq;
    }

    for (const user of users) {
        seq.addSequence(createUserBlur(user, bg, config));
    }
    return seq;
}

async function play(users: any[] = [], config: any = {}) {
    const seq = create(users, config);
    if (seq) { seq.play(); }
}

function createDrunkBlur(users: any[] = []) {
    const seq = new Sequence();
    seq.addSequence(create(users, { opacity: 1.00, sway: 1.0, durationX: 6500, durationY: 11000 }));
    seq.addSequence(create(users, { opacity: 0.57, sway: -0.9, durationX: 16500, durationY: 7000 }));
    seq.addSequence(create(users, { opacity: 0.47, sway: 1.1, durationX: 13000, durationY: 10500 }));
    return seq;
}

async function playDrunkBlur(users: any[] = []) {
    const seq = createDrunkBlur(users);
    if (seq) { seq.play(); }
}

async function stop(users: any[] = [], config: any = {}) {
    const { id } = adapter.mergeObject(DEFAULT_CONFIG, config);
    return Promise.all(users.map(user => Sequencer.EffectManager.endEffects({ name: `${id} - ${user.name}` })));
}

export const blur = { 
    create,
    play,
    stop,
    drunk: {
        create: createDrunkBlur,
        play: playDrunkBlur,
        stop,
    },
};