// Original Author: eskiemoh#2969 / .eskie
// Modularized: bakanabaka

import { closest } from '../../../lib/filemanager.js';
import { adapter } from '../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../utils/sound.js';

const DEFAULT_CONFIG = {
    darkMap: true,
    type: 'slashing', // 'slashing', 'piercing', 'bludgeoning'
    weight: 'medium', // 'light', 'medium', 'heavy'
    isCrit: false,
    sound: {
        attack: { ...DEFAULT_SOUND_CONFIG },
        burst: { ...DEFAULT_SOUND_CONFIG }
    }
};

async function createMelee(token: any, target: any, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { darkMap, sound } = mConfig;

    const sequence = new Sequence();
    applySound(sequence, sound.attack);
    for (let i = 0; i < 4; i++) {
        const offset = [
            { x: 0.3 * token.document.width, y: -0.85 * token.document.width },
            { x: 0.25 * token.document.width, y: -0.45 * token.document.width },
            { x: -0.2 * token.document.width, y: -0.4 * token.document.width },
            { x: -0.05 * token.document.width, y: 0 * token.document.width }
        ];

        sequence.effect()
            .name('DivineStrike')
            .delay(10 + 50 * i)
            .file(closest('jb2a.twinkling_stars.points04.white'))
            .atLocation(target)
            .rotateTowards(token)
            .scaleToObject(0.4, { gridUnits: true })
            .scaleIn(0, 500, { ease: 'easeOutBack' })
            .scaleOut(0, 250, { ease: 'easeOutCubic' })
            .duration(1000 - (10 + 50 * i))
            .spriteOffset(offset[i], { gridUnits: true })
            .zIndex(2);

        sequence.effect()
            .name('point')
            .delay(10 + 50 * i)
            .file(closest('eskie.pulse.energy.01.yellow.yellow'))
            .atLocation(target)
            .rotateTowards(token)
            .scaleToObject(0.4, { gridUnits: true })
            .spriteOffset(offset[i], { gridUnits: true })
            .filter('ColorMatrix', { saturate: -1 })
            .zIndex(2);
    }

    const bg = adapter.getSceneBackground(canvas?.scene);
    if (darkMap && bg?.src) {
        const dims = adapter.getSceneDimensions(canvas?.scene);
        sequence.effect()
            .file(closest(bg.src))
            .filter('ColorMatrix', { brightness: 0.5 })
            .atLocation(adapter.getSceneCenter(canvas?.scene))
            .size({ width: dims.width / dims.size, height: dims.height / dims.size }, { gridUnits: true })
            .spriteOffset({ x: -bg.offsetX, y: -bg.offsetY })
            .duration(2500)
            .fadeIn(250)
            .fadeOut(500)
            .belowTokens();
    }

    sequence.wait(500)
        .canvasPan()
        .delay(300)
        .shake({ duration: 1000, strength: 1, rotation: false, fadeOutDuration: 1000 });

    applySound(sequence, sound.burst);

    sequence.effect()
        .delay(300)
        .file(closest('jb2a.impact.ground_crack.01.purple'))
        .atLocation(target)
        .size(2.3 * token.document.width, { gridUnits: true })
        .filter('ColorMatrix', { saturate: 0, brightness: 0 })
        .belowTokens()
        .playbackRate(0.85)
        .randomRotation();

    sequence.effect()
        .delay(300)
        .file(closest('jb2a.particles.outward.white.02.03'))
        .scaleIn(0, 500, { ease: 'easeOutQuint' })
        .fadeOut(1500)
        .atLocation(target)
        .duration(1500)
        .size(2.15, { gridUnits: true })
        .zIndex(5);

    sequence.effect()
        .delay(300)
        .file(closest('eskie.pulse.energy.01.yellow.yellow'))
        .atLocation(target)
        .scaleToObject(1.75, { considerTokenScale: true })
        .filter('ColorMatrix', { saturate: -1 })
        .zIndex(1.1);

    sequence.effect()
        .file(closest('jb2a.divine_smite.target.yellowwhite'))
        .attachTo(target, { bindScale: false })
        .rotateTowards(token)
        .scaleToObject(2, { considerTokenScale: true })
        .spriteOffset({ x: -1.0 * token.document.width, y: 0 }, { gridUnits: true })
        .mirrorY()
        .rotate(90)
        .filter('ColorMatrix', { saturate: -0.35, hue: 150 })
        .zIndex(1);

    sequence.wait(250);

    return sequence;
}

async function playMelee(token: any, target: any, config: any = {}) {
    const sequence = await createMelee(token, target, config);
    if (sequence) return sequence.play();
}

async function createRanged(token: any, target: any, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { darkMap, sound } = mConfig;

    const sequence = new Sequence();
    applySound(sequence, sound.attack);
    const tokenCenter = adapter.getCenter(token);
    const targetCenter = adapter.getCenter(target);
    const distance = {
        x: (tokenCenter.x - targetCenter.x),
        y: (tokenCenter.y - targetCenter.y)
    };

    const midpoint = {
        x: (tokenCenter.x + targetCenter.x) / 2,
        y: (tokenCenter.y + targetCenter.y) / 2
    };

    const randomOffset = Math.abs(distance.x) > Math.abs(distance.y)
        ? [{ x: 0, y: 0.2 }, { x: 0, y: -0.35 }, { x: 0, y: 0.35 }, { x: 0, y: -0.2 }]
        : [{ x: -0.2, y: 0 }, { x: 0.35, y: 0 }, { x: -0.35, y: 0 }, { x: 0.2, y: 0 }];

    for (let i = 0; i < 4; i++) {
        const offset = [
            { x: distance.x / 4, y: distance.y / 4 },
            { x: distance.x / 12, y: distance.y / 12 },
            { x: -distance.x / 12, y: -distance.y / 12 },
            { x: -distance.x / 4, y: -distance.y / 4 }
        ];

        sequence.effect()
            .name('DivineStrike')
            .delay(10 + 50 * i)
            .file(closest('jb2a.twinkling_stars.points04.white'))
            .atLocation(midpoint, { offset: randomOffset[i], gridUnits: true })
            .scaleToObject(0.5, { gridUnits: true })
            .scaleIn(0, 500, { ease: 'easeOutBack' })
            .scaleOut(0, 250, { ease: 'easeOutCubic' })
            .duration(1000 - (10 + 50 * i))
            .spriteOffset(offset[i], { gridUnits: false })
            .zIndex(2);

        sequence.effect()
            .name('point')
            .delay(10 + 50 * i)
            .file(closest('eskie.pulse.energy.01.yellow.yellow'))
            .atLocation(midpoint, { offset: randomOffset[i], gridUnits: true })
            .scaleToObject(0.5, { gridUnits: true })
            .spriteOffset(offset[i], { gridUnits: false })
            .filter('ColorMatrix', { saturate: -1 })
            .zIndex(2);
    }

    const bg = adapter.getSceneBackground(canvas?.scene);
    if (darkMap && bg?.src) {
        const dims = adapter.getSceneDimensions(canvas?.scene);
        sequence.effect()
            .file(closest(bg.src))
            .filter('ColorMatrix', { brightness: 0.5 })
            .atLocation(adapter.getSceneCenter(canvas?.scene))
            .size({ width: dims.width / dims.size, height: dims.height / dims.size }, { gridUnits: true })
            .spriteOffset({ x: -bg.offsetX, y: -bg.offsetY })
            .duration(2000)
            .fadeIn(250)
            .fadeOut(500)
            .belowTokens();
    }
    sequence.wait(500);

    applySound(sequence, sound.burst);

    sequence.effect()
        .file(closest('jb2a.ranged.02.projectile.01.yellow'))
        .atLocation(token)
        .stretchTo(target)
        .opacity(1)
        .playbackRate(1.5)
        .filter('ColorMatrix', { saturate: 0.25 })
        .randomizeMirrorY()
        .filter('ColorMatrix', { saturate: -1, hue: 150 })
        .zIndex(0.2);

    sequence.effect()
        .file(closest('jb2a.ranged.03.projectile.01.pinkpurple'))
        .atLocation(token)
        .stretchTo(target)
        .opacity(1)
        .playbackRate(1.5)
        .randomizeMirrorY()
        .filter('ColorMatrix', { brightness: 0 })
        .zIndex(0.1);

    return sequence;
}

async function playRanged(token: any, target: any, config: any = {}) {
    const sequence = await createRanged(token, target, config);
    if (sequence) return sequence.play();
}

async function createTwilightMelee(token: any, target: any, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { darkMap, type, weight, isCrit, sound } = mConfig;

    if (!token || !target) return;

    const weightIndex = ({ light: 0, medium: 1, heavy: 2 } as Record<string, number>)[weight] ?? 1;
    const effectSize = 2 + (0.25 * weightIndex);
    const effectOffset = -0.75 - (0.25 * weightIndex);

    const targetSquare = adapter.getNearestSquareCenter(token, target);

    const sequence = new Sequence();
    applySound(sequence, sound.attack);

    const bg = adapter.getSceneBackground(canvas?.scene);
    if (darkMap && bg?.src) {
        const dims = adapter.getSceneDimensions(canvas?.scene);
        sequence.effect()
            .name(`Casting ${target.document.name}`)
            .file(closest(bg.src))
            .atLocation(adapter.getSceneCenter(canvas?.scene))
            .size({ width: dims.width / dims.size, height: dims.height / dims.size }, { gridUnits: true })
            .fadeIn(750)
            .fadeOut(750)
            .duration(3000)
            .filter('ColorMatrix', { brightness: 0 })
            .belowTokens()
            .opacity(0.5)
            .spriteOffset({ x: -bg.offsetX, y: -bg.offsetY });
    }

    sequence.wait(500);

    sequence.effect()
        .file(closest('eskie.casting.physical.01.center.one_shot.white'))
        .attachTo(token)
        .startTime(250)
        .scaleToObject(3, { considerTokenScale: true })
        .filter('ColorMatrix', { hue: 130 });

    sequence.effect()
        .file(closest(`eskie.attack.melee.twilight.01.${type}.${weight}.blue.slow`))
        .atLocation(token)
        .rotateTowards(targetSquare)
        .scaleToObject(effectSize, { considerTokenScale: true })
        .spriteOffset({ x: effectOffset * token.document.width }, { gridUnits: true })
        .randomizeMirrorY()
        .zIndex(1);

    applySound(sequence, sound.burst);

    sequence.effect()
        .delay(150)
        .file(closest('eskie.damage.radiant.01.rainbow'))
        .atLocation(targetSquare)
        .scaleToObject(1.25 * token.document.width, { considerTokenScale: true })
        .filter('ColorMatrix', { hue: -140 })
        .randomRotation()
        .zIndex(1);

    sequence.effect()
        .delay(150)
        .file(closest('eskie.damage.critical.01.white'))
        .atLocation(targetSquare)
        .scaleToObject(1.5, { considerTokenScale: true })
        .randomRotation()
        .filter('ColorMatrix', { hue: -140 })
        .zIndex(1)
        .playIf(isCrit);

    sequence.canvasPan()
        .delay(150)
        .shake({ duration: 500, strength: 1, rotation: false, fadeOutDuration: 500 });

    sequence.effect()
        .delay(150)
        .copySprite(target)
        .spriteRotation(-target.document.rotation)
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
        .opacity(0.5)
        .duration(500)
        .fadeOut(250);

    sequence.effect()
        .delay(150)
        .copySprite(target)
        .spriteRotation(-target.document.rotation)
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .filter('Glow', { color: '#fdffd3', distance: 10, outerStrength: 4, innerStrength: 0, knockout: true })
        .opacity(0.75)
        .duration(500)
        .fadeOut(250)
        .playIf(isCrit);

    return sequence;
}

async function playTwilightMelee(token: any, target: any, config: any = {}) {
    const sequence = await createTwilightMelee(token, target, config);
    if (sequence) return sequence.play();
}

async function createTwilightRanged(token: any, target: any, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { darkMap, isCrit, sound } = mConfig;

    if (!token || !target) return;

    const sequence = new Sequence();
    applySound(sequence, sound.attack);

    const bg = adapter.getSceneBackground(canvas?.scene);
    if (darkMap && bg?.src) {
        const dims = adapter.getSceneDimensions(canvas?.scene);
        sequence.effect()
            .name(`Casting ${target.document.name}`)
            .file(closest(bg.src))
            .atLocation(adapter.getSceneCenter(canvas?.scene))
            .size({ width: dims.width / dims.size, height: dims.height / dims.size }, { gridUnits: true })
            .fadeIn(750)
            .fadeOut(750)
            .duration(3000)
            .filter('ColorMatrix', { brightness: 0 })
            .belowTokens()
            .opacity(0.5)
            .spriteOffset({ x: -bg.offsetX, y: -bg.offsetY });
    }

    sequence.wait(500);

    sequence.effect()
        .file(closest('eskie.casting.physical.01.center.one_shot.white'))
        .attachTo(token)
        .scaleToObject(3, { considerTokenScale: true })
        .filter('ColorMatrix', { hue: 130 });

    sequence.effect()
        .file(closest('eskie.attack.ranged.arrow.01.twilight.heavy.blue.slow'))
        .atLocation(token)
        .stretchTo(target)
        .scale(1)
        .randomizeMirrorY()
        .zIndex(1)
        .waitUntilFinished(-500);

    applySound(sequence, sound.burst);

    sequence.effect()
        .file(closest('eskie.damage.radiant.01.rainbow'))
        .atLocation(target)
        .scaleToObject(1.25 * token.document.width, { considerTokenScale: true })
        .filter('ColorMatrix', { hue: -140 })
        .randomRotation()
        .zIndex(1);

    sequence.effect()
        .file(closest('eskie.damage.critical.01.white'))
        .atLocation(target)
        .scaleToObject(1.5, { considerTokenScale: true })
        .randomRotation()
        .filter('ColorMatrix', { hue: -140 })
        .zIndex(1)
        .playIf(isCrit);

    sequence.canvasPan()
        .shake({ duration: 500, strength: 1, rotation: false, fadeOutDuration: 500 });

    sequence.effect()
        .copySprite(target)
        .spriteRotation(-target.document.rotation)
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .loopProperty('sprite', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
        .opacity(0.5)
        .duration(500)
        .fadeOut(250);

    sequence.effect()
        .copySprite(target)
        .spriteRotation(-target.document.rotation)
        .attachTo(target)
        .scaleToObject(1, { considerTokenScale: true })
        .filter('Glow', { color: '#fdffd3', distance: 10, outerStrength: 4, innerStrength: 0, knockout: true })
        .opacity(0.75)
        .duration(500)
        .fadeOut(250)
        .playIf(isCrit);

    return sequence;
}

async function playTwilightRanged(token: any, target: any, config: any = {}) {
    const sequence = await createTwilightRanged(token, target, config);
    if (sequence) return sequence.play();
}

export const divineStrike = {
    create: createMelee,
    play: playMelee,
    melee: {
        create: createMelee,
        play: playMelee,
        default_config: DEFAULT_CONFIG
    },
    ranged: {
        create: createRanged,
        play: playRanged,
        default_config: DEFAULT_CONFIG
    },
    twilight: {
        melee: {
            create: createTwilightMelee,
            play: playTwilightMelee,
            default_config: DEFAULT_CONFIG
        },
        ranged: {
            create: createTwilightRanged,
            play: playTwilightRanged,
            default_config: DEFAULT_CONFIG
        },
        create: createTwilightMelee,
        play: playTwilightMelee,
        default_config: DEFAULT_CONFIG
    },
    default_config: DEFAULT_CONFIG
};

adapter.autorec.register(adapter.autorec.MELEE('divineStrike', 'Divine Strike'), 'melee-target', 'eskie.effect.divineStrike.melee', DEFAULT_CONFIG, '0.0.3', '(Melee) Divine Strike');
adapter.autorec.register(adapter.autorec.RANGED('divineStrike', 'Divine Strike'), 'ranged-target', 'eskie.effect.divineStrike.ranged', DEFAULT_CONFIG, '0.0.3', '(Ranged) Divine Strike');
adapter.autorec.register(adapter.autorec.MELEE('divineStrikeTwilight', 'Divine Strike (Twilight)'), 'melee-target', 'eskie.effect.divineStrike.twilight.melee', DEFAULT_CONFIG, '0.0.3', '(Melee) Divine Strike (Twilight)');
adapter.autorec.register(adapter.autorec.RANGED('divineStrikeTwilight', 'Divine Strike (Twilight)'), 'ranged-target', 'eskie.effect.divineStrike.twilight.ranged', DEFAULT_CONFIG, '0.0.3', '(Ranged) Divine Strike (Twilight)');


