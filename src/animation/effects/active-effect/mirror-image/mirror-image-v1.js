/* **
   Original Author: EskieMoh#2969
   Update Author: bakanabaka
** */

import { closest } from '../../../../lib/filemanager.js';
import { settingsOverride } from '../../../../lib/settings.js';
import { adapter } from '../../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../../utils/sound.js';

export const DEFAULT_CONFIG = {
    id: 'mirrorImage',
    imageNumber: 3, // Default number of mirror images
    sound: { ...DEFAULT_SOUND_CONFIG },
};

/**
 * Creates a Sequencer effect for Mirror Image (V1 - Classic Shimmer).
 *
 * @param {Token} token The token creating mirror images.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function create(token, config = {}) {
    config = settingsOverride(config);
    const { id, imageNumber, sound } = adapter.mergeObject(DEFAULT_CONFIG, config);
    const label = `${id} - ${token.id}`;

    const sequence = new Sequence();
    applySound(sequence, sound);
    sequence
        .effect()
            .file(closest('jb2a.shimmer.01.purple'))
            .opacity(0.5)
            .rotate(-90)
            .scaleToObject(1.25)
            .atLocation(token)

        .animation()
            .on(token)
            .opacity(0)

        .effect()
            .file(closest('jb2a.particles.outward.orange.02.03'))
            .scaleToObject(2.5)
            .atLocation(token)
            .fadeIn(1000)
            .duration(10000)
            .fadeOut(2000)
            .randomRotation()

        .effect()
            .copySprite(token)
            .spriteRotation(-token.document.rotation)
            .atLocation(token)
            .scaleToObject(1, { considerTokenScale: true })
            .belowTokens()
            .animateProperty('spriteContainer', 'position.x', { from: -80, to: 80, duration: 1500, pingPong: true })
            .duration(1500)
            .opacity(0.75)
            .tint('#d0c2ff')
            .loopProperty('alphaFilter', 'alpha', { from: 0.75, to: 0.5, duration: 2000, pingPong: true })

        .effect()
            .copySprite(token)
            .spriteRotation(-token.document.rotation)
            .atLocation(token)
            .scaleToObject(1, { considerTokenScale: true })
            .belowTokens()
            .animateProperty('spriteContainer', 'position.x', { from: 80, to: -80, duration: 1500, pingPong: true })
            .duration(1500)
            .opacity(0.75)
            .tint('#d0c2ff')
            .loopProperty('alphaFilter', 'alpha', { from: 0.75, to: 0.5, duration: 2000, pingPong: true })

        .wait(500)

        // Image 1
        .effect()
            .name(`${label} (1)`) // Unique name for stopping
            .copySprite(token)
            .spriteRotation(-token.document.rotation)
            .atLocation(token)
            .scaleToObject(1, { considerTokenScale: true })
            .anchor({ x: 0.9 + (imageNumber * 0.05) })
            .belowTokens()
            .attachTo(token, { bindAlpha: false, bindRotation: false })
            .persist()
            .animateProperty('sprite', 'rotation', { from: 180, to: -10, duration: 500 })
            .loopProperty('spriteContainer', 'position.x', { from: -5, to: 5, duration: 2500, pingPong: true })
            .zeroSpriteRotation()
            .opacity(0.75)
            .tint('#d0c2ff')
            .loopProperty('alphaFilter', 'alpha', { from: 0.75, to: 0.5, duration: 2000, pingPong: true })
            .zIndex(4)

        // Image 2
        .effect()
            .name(`${label} (2)`) // Unique name for stopping
            .copySprite(token)
            .spriteRotation(-token.document.rotation)
            .scaleToObject(1, { considerTokenScale: true })
            .playIf(imageNumber >= 2)
            .atLocation(token)
            .anchor({ x: 0.9 + (imageNumber * 0.05) })
            .belowTokens()
            .attachTo(token, { bindAlpha: false, bindRotation: false })
            .persist()
            .animateProperty('sprite', 'rotation', { from: 0, to: 190, duration: 500 })
            .loopProperty('spriteContainer', 'position.x', { from: -5, to: 5, duration: 2500, pingPong: true, delay: 250 })
            .zeroSpriteRotation()
            .opacity(0.75)
            .tint('#d0c2ff')
            .loopProperty('alphaFilter', 'alpha', { from: 0.75, to: 0.5, duration: 2000, pingPong: true })
            .zIndex(4)

        // Image 3
        .effect()
            .name(`${label} (3)`) // Unique name for stopping
            .copySprite(token)
            .spriteRotation(-token.document.rotation)
            .scaleToObject(1, { considerTokenScale: true })
            .playIf(imageNumber === 3)
            .atLocation(token)
            .anchor({ x: 0.9 + (imageNumber * 0.05) })
            .belowTokens()
            .attachTo(token, { bindAlpha: false, bindRotation: false })
            .persist()
            .animateProperty('sprite', 'rotation', { from: 0, to: 90, duration: 250 })
            .loopProperty('spriteContainer', 'position.x', { from: -5, to: 5, duration: 2500, pingPong: true })
            .zeroSpriteRotation()
            .opacity(0.75)
            .tint('#d0c2ff')
            .loopProperty('alphaFilter', 'alpha', { from: 0.75, to: 0.5, duration: 2000, pingPong: true })
            .delay(100)
            .zIndex(4)

        .wait(200)

        .effect()
            .file(closest('jb2a.shimmer.01.purple'))
            .opacity(0.5)
            .rotate(90)
            .scaleToObject(1.25)
            .atLocation(token)

        .animation()
            .on(token)
            .fadeIn(1000)
            .opacity(1);

    return sequence;
}

/**
 * Plays the Mirror Image effect on a token.
 *
 * @param {Token} token The token creating mirror images.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<void>} A promise that resolves when the sequence starts playing.
 */
async function play(token, config = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mConfig;

    const label = `${id} - ${token.id}`;
    const activeEffect = Sequencer.EffectManager.getEffects({ name: `${label}*`, object: token }).length > 0;

    if (activeEffect) {
        await stop(token, mConfig);
        return;
    }

    const sequence = await create(token, mConfig);
    if (sequence) return sequence.play();
}

/**
 * Stops the persistent Mirror Image effects on a token.
 *
 * @param {Token} token The token to remove mirror images from.
 * @param {object} config Configuration options.
 */
async function stop(token, config = {}) {
    if (!token) return;
    const { id } = adapter.mergeObject(DEFAULT_CONFIG, config);
    const label = `${id} - ${token.id}*`;

    Sequencer.EffectManager.endEffects({ name: label });

    await new Sequence()
        .animation()
            .on(token)
            .fadeIn(1000)
            .opacity(1)
            .play();
}

export const mirrorImageV1 = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
