import { animation } from './animation/index.js';
import { autoanimations } from './integration/autoanimations.js';
import { socketlibapi, socket } from './integration/socketlib.js';
import { loadWorldScripts } from './world-scripts/loader.js';
import { MODULE_ID } from './lib/constants.js';
import { standaloneMacros } from './lib/standalone-macros.js';
import { template } from './lib/templates.js';

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

        // Attach module internal utilities and tools to game.modules.get('eskie-macros').api
        const moduleRecord = game.modules.get(MODULE_ID);
        if (moduleRecord) {
            moduleRecord.api = {
                socket,
                standaloneMacros,
                template,
                templates: template
            };
        }
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