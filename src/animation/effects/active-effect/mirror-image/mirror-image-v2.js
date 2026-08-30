/* **
   Original Author: .eskie
   Update Author: bakanabaka
** */

import { closest } from '../../../../lib/filemanager.js';
import { settingsOverride } from '../../../../lib/settings.js';
import { adapter } from '../../../../adapters/index.js';
import { applySound, DEFAULT_SOUND_CONFIG } from '../../../utils/sound.js';

export const DEFAULT_CONFIG = {
    id: 'mirrorImage',
    imageNumber: 3,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

/**
 * Creates a Sequencer effect for Mirror Image (V2 - Rising Stars).
 *
 * @param {Token} token The token creating mirror images.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function create(token, config = {}) {
    config = settingsOverride(config);
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, imageNumber, sound } = mConfig;

    if (!token) return;

    const sequence = new Sequence();
    applySound(sequence, sound);

    const tokenName = token.name ?? token.document?.name ?? 'Token';

    sequence
        .animation()
            .delay(250)
            .on(token)
            .opacity(0)

        .effect()
            .file(closest('eskie.casting.arcane.01.center.one_shot.purple'))
            .attachTo(token, { bindAlpha: false })
            .scaleToObject(0.8, { considerTokenScale: true })
            .zIndex(2)

        .effect()
            .copySprite(token)
            .attachTo(token, { bindAlpha: false })
            .scaleToObject(1, { considerTokenScale: true })
            .animateProperty('sprite', 'alpha', { from: 0, to: -0.5, duration: 500, ease: 'easeOutCubic', delay: 250 })
            .animateProperty('sprite', 'alpha', { from: 0, to: 0.5, duration: 250, ease: 'easeInCubic', delay: 750 })
            .duration(1250)

        .effect()
            .file(closest('blfx.spell.template.circle.particles.3.rise.star1.loop.color1'))
            .attachTo(token, { bindAlpha: false })
            .scaleToObject(1.75, { considerTokenScale: true })
            .zIndex(1)
            .startTime(1000)
            .animateProperty('sprite', 'position.x', { from: 0.25, to: -0.25, duration: 500, gridUnits: true, ease: 'easeOutCubic' })
            .animateProperty('sprite', 'position.x', { from: 0, to: 0.25, duration: 250, gridUnits: true, ease: 'easeInCubic', delay: 500 })
            .duration(2250)
            .fadeIn(500, { ease: 'easeOutCubic' })
            .fadeOut(500, { ease: 'easeInCubic' })
            .opacity(0.8)
            .belowTokens()

        .effect()
            .copySprite(token)
            .attachTo(token, { bindAlpha: false })
            .scaleToObject(1, { considerTokenScale: true })
            .zIndex(0)
            .opacity(0.5)
            .tint('#dca9fe')
            .animateProperty('sprite', 'position.x', { from: 0.25, to: -0.25, duration: 500, gridUnits: true, ease: 'easeOutCubic' })
            .animateProperty('sprite', 'position.x', { from: 0, to: 0.25, duration: 250, gridUnits: true, ease: 'easeInCubic', delay: 500 })
            .duration(1250)
            .fadeIn(500, { ease: 'easeOutCubic' })
            .fadeOut(500, { ease: 'easeInCubic' })
            .belowTokens()

        .effect()
            .file(closest('blfx.spell.template.circle.particles.3.rise.star1.loop.color1'))
            .attachTo(token, { bindAlpha: false })
            .scaleToObject(1.75, { considerTokenScale: true })
            .zIndex(1)
            .startTime(1000)
            .animateProperty('sprite', 'position.x', { from: -0.25, to: 0.25, duration: 500, gridUnits: true, ease: 'easeOutCubic' })
            .animateProperty('sprite', 'position.x', { from: 0, to: -0.25, duration: 250, gridUnits: true, ease: 'easeInCubic', delay: 500 })
            .duration(2250)
            .fadeIn(500, { ease: 'easeOutCubic' })
            .fadeOut(500, { ease: 'easeInCubic' })
            .opacity(0.8)
            .belowTokens()

        .effect()
            .copySprite(token)
            .attachTo(token, { bindAlpha: false })
            .scaleToObject(1, { considerTokenScale: true })
            .zIndex(0)
            .opacity(0.5)
            .tint('#dca9fe')
            .animateProperty('sprite', 'position.x', { from: -0.25, to: 0.25, duration: 500, gridUnits: true, ease: 'easeOutCubic' })
            .animateProperty('sprite', 'position.x', { from: 0, to: -0.25, duration: 250, gridUnits: true, ease: 'easeInCubic', delay: 500 })
            .duration(1250)
            .fadeIn(500, { ease: 'easeOutCubic' })
            .fadeOut(500, { ease: 'easeInCubic' })
            .belowTokens()

        .animation()
            .delay(1000)
            .on(token)
            .opacity(1)

        .effect()
            .delay(750)
            .file(closest('jb2a.particles.outward.purple.02.04'))
            .attachTo(token, { bindAlpha: false })
            .scaleToObject(1.25, { considerTokenScale: true })
            .zIndex(1)
            .scaleIn(0, 500, { ease: 'easeOutCubic' })
            .fadeOut(500)
            .duration(1000);

    const radius = 0.45;
    for (let i = 0; i < imageNumber; i++) {
        const angle = (Math.PI * 2 / imageNumber) * i - Math.PI / 2;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;

        const imgSeq = new Sequence()
            .wait(750)
            .effect()
                .name(`${tokenName} Mirror Image ${i + 1}`)
                .copySprite(token)
                .attachTo(token, { offset: { x: offsetX, y: offsetY }, gridUnits: true, bindAlpha: false, local: false })
                .scaleToObject(1, { considerTokenScale: true })
                .zIndex(0)
                .opacity(0.5)
                .tint('#dca9fe')
                .animateProperty('sprite', 'position.x', { from: -offsetX, to: 0, duration: 500, gridUnits: true, ease: 'easeOutCubic' })
                .animateProperty('sprite', 'position.y', { from: -offsetY, to: 0, duration: 500, gridUnits: true, ease: 'easeOutCubic' })
                .duration(1500)
                .fadeIn(500, { ease: 'easeOutCubic' })
                .fadeOut(1000)
                .belowTokens()
                .persist()
                .loopProperty('sprite', 'alpha', { from: 0.5, to: 0.35, duration: 3000, ease: 'easeInOutSine', pingPong: true })
                .loopProperty('spriteContainer', 'position.x', { from: 0, to: -offsetX / 8, duration: 3000, gridUnits: true, ease: 'easeInOutSine', pingPong: true })
                .loopProperty('spriteContainer', 'position.y', { from: 0, to: -offsetY / 8, duration: 3000, gridUnits: true, ease: 'easeInOutSine', pingPong: true })

            .effect()
                .name(`${tokenName} Mirror Image ${i + 1}`)
                .file(closest('blfx.spell.template.circle.particles.3.rise.star1.loop.color1'))
                .attachTo(token, { bindAlpha: false })
                .scaleToObject(1.75, { considerTokenScale: true })
                .zIndex(1)
                .startTime(1000)
                .animateProperty('sprite', 'position.x', { from: 0, to: offsetX, duration: 500, gridUnits: true, ease: 'easeOutCubic' })
                .animateProperty('sprite', 'position.y', { from: 0, to: offsetY, duration: 500, gridUnits: true, ease: 'easeOutCubic' })
                .duration(2250)
                .fadeIn(500, { ease: 'easeOutCubic' })
                .fadeOut(1000, { ease: 'easeInCubic' })
                .opacity(0.8)
                .belowTokens();

        sequence.addSequence(imgSeq);
    }

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
    const tokenName = token.name ?? token.document?.name ?? 'Token';
    const label = `${tokenName} Mirror Image`;
    const activeEffect = Sequencer.EffectManager.getEffects({ name: `${label} *` }).length > 0;

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
    const tokenName = token.name ?? token.document?.name ?? 'Token';
    Sequencer.EffectManager.endEffects({ name: `${tokenName} Mirror Image *` });
    Sequencer.EffectManager.endEffects({ name: `${tokenName} Mirror Image *`, object: token });

    await new Sequence()
        .animation()
            .on(token)
            .fadeIn(1000)
            .opacity(1)
            .play();
}

export const mirrorImageV2 = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};
