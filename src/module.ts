import { animation } from './animation/index.js';
import { loadWorldScripts } from './world-scripts/loader.js';
import { MODULE_ID } from './lib/constants.js';
import { standaloneMacros } from './lib/standalone-macros.js';
import { adapter, Adapter } from './adapters/index.js';

// Import module settings to also run its initialization code
import './settings.js';
import { log } from './lib/logger.js';

const status = {
    aaReady: false,
    ready: false,
};

export function setupApiCalls(exportedFunctions: Record<string, unknown>): void {
    globalThis.eskie = Object.assign(
        globalThis.eskie ?? {},
        exportedFunctions
    );
}

export function setupModule(): void {
    const { effect, mask, overlay, showcase, traps, summon } = animation;

    // Expose only active sequencer play/animation namespaces on globalThis.eskie
    setupApiCalls({
        effect,
        traps,
        mask,
        overlay,
        showcase,
        summon
    });

    // Attach module public API to game.modules.get('eskie-macros').api
    const moduleRecord = game.modules?.get(MODULE_ID) as any;
    if (moduleRecord) {
        moduleRecord.api = {
            Adapter,
            adapter,
            animation,
            standaloneMacros
        };
    }
}

Hooks.once('init', async () => {
    // Initialize unified adapter layer across Foundry platform, game system, and active modules
    await adapter.init();

    // Preload Handlebars templates
    await adapter.loadTemplates([
        `modules/${MODULE_ID}/src/ui/autoanimations/autorecUpdateMenu.html`,
        `modules/${MODULE_ID}/src/ui/autorec/destinationDialog.html`,
        `modules/${MODULE_ID}/src/ui/autorec/manageAutorecMenu.html`,
        `modules/${MODULE_ID}/src/ui/blfx/autorecUpdateMenu.html`,
        `modules/${MODULE_ID}/src/ui/blfx/enableUpdatesPrompt.html`,
        `modules/${MODULE_ID}/src/ui/recommended-modules/recommendedModulesMenu.html`,
        `modules/${MODULE_ID}/src/ui/world-scripts/worldScriptsMenu.html`
    ]);

    setupModule();
    log.info('Eskie Macro Pack module ready');
});

Hooks.once('ready', async () => {
    status.ready = true;
    const isAaActive = Boolean(game.modules?.get('autoanimations')?.active);
    if (!isAaActive || status.aaReady) {
        await adapter.autorec.submit();
    }

    // Load enabled world scripts for the player
    loadWorldScripts();
});

Hooks.once('aa.ready', async () => {
    status.aaReady = true;
    if (status.ready) {
        await adapter.autorec.submit();
    }
});

Hooks.once('socketlib.ready', async () => { await (adapter.socketlib as any).register(); });