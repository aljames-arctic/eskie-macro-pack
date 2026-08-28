import { animation } from './animation/index.js';
import { autorec } from './adapters/modules/autorec/autorec.js';
import { autoanimations } from './adapters/modules/autoanimations/autoanimations.js';
import { blfx } from './adapters/modules/blfx/blfx.js';
import { socketlibapi, socket } from './adapters/modules/socketlib/socketlib.js';
import { loadWorldScripts } from './world-scripts/loader.js';
import { MODULE_ID } from './lib/constants.js';
import { crosshair } from './lib/crosshairs.js';
import { standaloneMacros } from './lib/standalone-macros.js';
import { template } from './lib/templates.js';
import { adapter } from './adapters/index.js';

// Import module settings to also run its initialization code
import './settings.js';
import { log } from './lib/logger.js';

const status = {
    aaReady: false,
    ready: false,
};

Hooks.once('init', async () => {
    // Initialize unified adapter layer across Foundry platform, game system, and active modules
    await adapter.init();

    function setupModule() {
        function setupApiCalls(exportedFunctions) {
            globalThis.eskie = foundry.utils.mergeObject(
                globalThis.eskie ?? {},
                exportedFunctions
            );
        }

        const { effect, mask, overlay, showcase, traps } = animation;

        // Expose only active sequencer play/animation APIs and adapter on globalThis.eskie
        setupApiCalls({
            adapter,
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
                adapter,
                autorec,
                autoanimations,
                blfx,
                crosshair,
                socket,
                standaloneMacros,
                template
            };
        }
    }

    setupModule();
    log.info('Eskie Macro Pack module ready');
});

Hooks.once('ready', async () => {
    status.ready = true;
    const isAaActive = Boolean(game.modules?.get('autoanimations')?.active);
    if (!isAaActive || status.aaReady) {
        await autorec.submit();
    }

    // Load enabled world scripts for the player
    loadWorldScripts();
});

Hooks.once('aa.ready', async () => {
    status.aaReady = true;
    if (status.ready) {
        await autorec.submit();
    }
});

Hooks.once('socketlib.ready', async () => { await socketlibapi.register(); });