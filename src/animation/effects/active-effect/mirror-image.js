import { autorec } from '../../../adapters/modules/autorec/autorec-module-adapter.js';
import { adapter } from '../../../adapters/index.js';

import { mirrorImageV1 as v1, DEFAULT_CONFIG as config_v1 } from './mirror-image/mirror-image-v1.js';
import { mirrorImageV2 as v2, DEFAULT_CONFIG as config_v2 } from './mirror-image/mirror-image-v2.js';

const DEFAULT_CONFIG = {
    version: 2,
    config_v1,
    config_v2,
};

function getVersion(config = {}) {
    const { version } = adapter.mergeObject(DEFAULT_CONFIG, config);

    // Merge the DEFAULT_CONFIG with our possibly modified input config
    const map = [
        { fn: v1, cfg: adapter.mergeObject(config_v1, (config.config_v1 ?? {})) },
        { fn: v2, cfg: adapter.mergeObject(config_v2, (config.config_v2 ?? {})) },
    ];

    if (version > map.length || version <= 0) return;
    return map[version - 1];
}

function create(token, config = {}) {
    const version = getVersion(config);
    if (!version) return;
    return version.fn.create(token, version.cfg);
}

async function play(token, config = {}) {
    const version = getVersion(config);
    if (!version) return;
    return version.fn.play(token, version.cfg);
}

async function stop(token, config = {}) {
    // If a specific version is targeted, stop it; otherwise stop across both versions
    const version = getVersion(config);
    if (version) {
        return version.fn.stop(token, version.cfg);
    }
    await v1.stop(token, config_v1);
    await v2.stop(token, config_v2);
}

export const mirrorImage = {
    create,
    play,
    stop,

    v1,
    v2,
    default_config: DEFAULT_CONFIG,
};

autorec.register('mirrorImage', 'effect', 'eskie.effect.mirrorImage', DEFAULT_CONFIG, '1.0.0', 'Mirror Image');