/* **
   Original Author: .eskie
   Update Author: bakanabaka
** */

import { closest } from "../../../lib/filemanager.js";

import { adapter } from "../../../adapters/index.js";
import { applySound, DEFAULT_SOUND_CONFIG } from "../../utils/sound.js";
import { resolveMotionTarget, endEffectsAndMotions } from "../../utils/motion.js";
const DEFAULT_CONFIG = {
    id: 'wings',
    image: 'eskie.wings',
    offset: { x: 0, y: 0 },
    hue: 0,             // Hue change
    wingSize: 1,        // Wing Size
    speedMulti: 1,      // Wing Speed multiplier
    swayMulti: 1,       // Token Sway Distance multiplier
    mirrorX: false,
    mirrorY: false,
    sound: { ...DEFAULT_SOUND_CONFIG },
};

/**
 * Creates a Sequencer effect for a token with wings (version 2).
 *
 * @param {Token} token The token to add wings to.
 * @param {object} config Configuration options for the animation.
 * @returns {Sequence} The created Sequence object.
 */
async function createWings(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id, image, offset, hue, wingSize, speedMulti, swayMulti, mirrorX, mirrorY, sound } = mConfig;
    const label = `${id} - ${token.id}`;
    const motionToken = resolveMotionTarget(token);
    const gridSize = adapter.getGridSize();

    // Original lifted by -(0.5 + 0.1 * swayMulti) GU over 1000ms (easeOutBack), then oscillated
    // across [0 .. 0.1 * swayMulti] GU over a full cycle period of (3000 / speedMulti) ms.
    const hoverCenterY = -(0.5 + (0.05 * swayMulti));
    const swayAmplitudePx = 0.05 * swayMulti * gridSize;
    const swayPeriod = 3000 / speedMulti;

    const sequence = new Sequence();
    applySound(sequence, sound);

    if (motionToken) {
        sequence
            .motion(motionToken)
            .name(label)
            .zIndex(2)
            .moveBy({ y: hoverCenterY }, { gridUnits: true, duration: 1000, ease: "easeOutBack", returnDuration: 500, easeOut: "easeInOutQuad" })
            .oscillate({
                period: swayPeriod,
                waveform: "sine",
                fadeInDuration: 300,
                fadeOutDuration: 300,
                y: { amplitude: swayAmplitudePx, phase: Math.PI / 6 },
            })
            .persist();
    }

    sequence
        .effect()
        .name(label) // Unique name for stopping
        .copySprite(token)
        .rotate(token.document.rotation)
        .spriteRotation(token.document.rotation)
        .attachTo(token, { bindAlpha: false, ignoreMotion: true })
        .scaleToObject(0.8, { considerTokenScale: true })
        .zIndex(0.1)
        .persist()
        .belowTokens()
        .filter("ColorMatrix", { brightness: 0 })
        .filter("Blur", { blurX: 5, blurY: 10 })
        .opacity(0.65)

        .effect()
        .name(label) // Unique name for stopping
        .file(closest(image))
        .mirrorX(mirrorX)
        .mirrorY(mirrorY)
        .attachTo(token, { offset: { y: offset.y, x: offset.x }, gridUnits: true, bindAlpha: false })
        .scaleToObject(3 * wingSize)
        .persist()
        .playbackRate(speedMulti)
        .filter("ColorMatrix", { hue: hue });

    return sequence;
}

/**
 * Plays or stops the Wings effect (version 2) on a token.
 * Toggles the effect based on its active state.
 *
 * @param {Token} token The token to apply/remove wings from.
 * @param {object} config Configuration options for the animation.
 * @returns {Promise<void>} A promise that resolves when the effect is played or stopped.
 */
async function playWings(token: Token, config: any = {}) {
    const sequence = await createWings(token, config);
    if (sequence) { sequence.play(); }
}

/**
 * Stops the persistent Wings effects (version 2) on a token.
 *
 * @param {Token} token The token to remove wings from.
 * @param {object} config Configuration options for the animation.
 */
function stopWings(token: Token, config: any = {}) {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);
    const { id } = mConfig;
    const label = `${id} - ${token.id}`;

    return endEffectsAndMotions(token, label);
}

export const wings = {
    create: createWings,
    play: playWings,
    stop: stopWings,
    default_config: DEFAULT_CONFIG,
};
