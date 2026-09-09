import { closest } from '../../lib/filemanager.js';
import { MODULE_ID } from '../../lib/constants.js';

export const DEFAULT_SOUND_CONFIG = {
    enable: false,
    file: '',
    delay: 0,
    volume: 0.5,
    fadeIn: 0,
    fadeOut: 0,
    startTime: null,
    endTime: null
};

/**
 * Attaches sound effect(s) to a Sequence based on sound configuration.
 *
 * Supports single sound object, multiple named sound sections, or array of sounds.
 * Supports start/end timestamps via startTime, endTime, or timeRange.
 *
 * @param {Sequence} sequence The Sequence instance to modify
 * @param {Object|Array} soundConfig Sound configuration object or array
 * @param {number} [defaultDelay=0] Fallback delay in milliseconds
 * @returns {Sequence} The modified Sequence instance
 */
export function applySound(sequence, soundConfig, defaultDelay = 0) {
    if (!sequence || !soundConfig) return sequence;

    if (typeof game !== 'undefined' && game.settings?.get && game.settings.get(MODULE_ID, 'enableSounds') === false) {
        return sequence;
    }

    const isSingleSound = typeof soundConfig === 'object' && (
        soundConfig.enable !== undefined ||
        typeof soundConfig.file === 'string' ||
        typeof soundConfig.path === 'string'
    );

    const sounds = Array.isArray(soundConfig)
        ? soundConfig
        : isSingleSound
            ? [soundConfig]
            : Object.values(soundConfig);

    for (const s of sounds) {
        if (!s || typeof s !== 'object') continue;

        const isEnabled = Boolean(s.enable);
        const filePath = s.file ?? s.path ?? '';
        if (!isEnabled || !filePath) continue;

        const soundEffect = sequence.sound()
            .file(closest(filePath))
            .volume(s.volume ?? 0.5);

        const delay = s.delay ?? defaultDelay;
        if (delay != null && delay > 0) {
            soundEffect.delay(delay);
        }
        if (s.fadeIn != null && s.fadeIn > 0) {
            soundEffect.fadeIn(s.fadeIn);
        }
        if (s.fadeOut != null && s.fadeOut > 0) {
            soundEffect.fadeOut(s.fadeOut);
        }

        if (Array.isArray(s.timeRange) && s.timeRange.length >= 2) {
            soundEffect.timeRange(s.timeRange[0], s.timeRange[1]);
        } else {
            if (s.startTime != null && s.startTime > 0) {
                soundEffect.startTime(s.startTime);
            }
            if (s.endTime != null && s.endTime > 0) {
                soundEffect.endTime(s.endTime);
            }
        }

        if (s.repeats != null) {
            if (Array.isArray(s.repeats)) {
                soundEffect.repeats(...s.repeats);
            } else if (s.repeatDelay != null) {
                soundEffect.repeats(s.repeats, s.repeatDelay);
            } else {
                soundEffect.repeats(s.repeats);
            }
        }
    }

    return sequence;
}

export const sound = {
    DEFAULT_SOUND_CONFIG,
    applySound,
};
