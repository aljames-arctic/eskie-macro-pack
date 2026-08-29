import { MODULE_ID } from "../lib/constants.js";

export function settingsOverride(config = {}) {
    if (!game.settings.get(MODULE_ID, 'enableSounds')) {
        config = foundry.utils.mergeObject(config, { sound: { enable: false, enabled: false } });
        if (config.sound && typeof config.sound === 'object') {
            for (const key of Object.keys(config.sound)) {
                if (config.sound[key] && typeof config.sound[key] === 'object') {
                    config.sound[key].enable = false;
                    config.sound[key].enabled = false;
                }
            }
        }
    }
    return config;
}