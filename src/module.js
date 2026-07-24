import { animation } from './animation/_animation.js';
import { autoanimations } from './integration/autoanimations.js';
import { socketlibapi } from './integration/socketlib.js';

import { loadWorldScripts } from './world-scripts/loader.js';

// Import module settings to also run its initialization code
import './settings.js';
import { log } from './lib/logger.js';

const status = {
    aaReady: false,
    ready: false,
}

Hooks.once('init', async () => {
    function setupModule() {
        function setupApiCalls(exportedFunctions) {
            globalThis.eskie = foundry.utils.mergeObject(
                globalThis.eskie ?? {},
                exportedFunctions
            );
        }

        const { effect, mask, overlay, showcase, traps } = animation;

        // Expose only active sequencer play/animation APIs on globalThis.eskie
        setupApiCalls({
            effect,
            traps,
            mask,
            overlay,
            showcase
        });
    }

    setupModule();
    log.info('Eskie Macro Pack module ready');
});

Hooks.once('ready', async () => {
    status.ready = true;
    if (status.ready && status.aaReady)
        await autoanimations.submit();

    // Load enabled world scripts for the player
    loadWorldScripts();
});

Hooks.once('aa.ready', async () => {
    status.aaReady = true;
    if (status.ready && status.aaReady)
        await autoanimations.submit();
});

Hooks.once('socketlib.ready', async () => { await socketlibapi.register(); });