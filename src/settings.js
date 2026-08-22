import { MODULE_ID } from "./lib/constants.js";
import { autorecUpdateFormApplication } from "./integration/autoanimations/updateMenu.js";
import { BlfxAutorecUpdateFormApplication } from "./integration/blfx/updateMenu.js";
import { AutorecDestinationDialog } from "./integration/autorec/destinationDialog.js";
import { blfx } from "./integration/blfx.js";
import { WorldScriptsFormApplication } from "./world-scripts/worldScriptsMenu.js";
import { RecommendedModulesFormApplication } from "./recommended-modules/recommendedModulesMenu.js";
import { updateMacroCompendiums } from "./lib/standalone-macros.js";
import { log } from './lib/logger.js';

/* Initialize Module Settings */
Hooks.once('init', function() {
    log.info('Initializing Eskie Macro Pack settings');

    const isDevBuild = game.modules.get(MODULE_ID)?.version === "#{VERSION}#";

    // Recommended Modules Guide Menu
    game.settings.registerMenu(MODULE_ID, 'recommendedModules', {
        name: 'EMP.settings.recommendedModules.name',
        label: 'EMP.settings.recommendedModules.label',
        icon: 'fa-solid fa-puzzle-piece',
        type: RecommendedModulesFormApplication,
        restricted: false
    });

    // Auto-Recognition Destination Chooser Menu
    game.settings.registerMenu(MODULE_ID, 'autorecDestinationMenu', {
        name: 'EMP.settings.autorecDestinationMenu.name',
        label: 'EMP.settings.autorecDestinationMenu.label',
        hint: 'EMP.settings.autorecDestinationMenu.hint',
        icon: 'fa-solid fa-wand-magic-sparkles',
        type: AutorecDestinationDialog,
        restricted: true
    });

    // Dev-only standalone macro compendium sync menu (enabled when version is #{VERSION}#)
    if (isDevBuild) {
        game.settings.registerMenu(MODULE_ID, 'generateCompendiums', {
            name: 'EMP.settings.generateCompendiums.name',
            label: 'EMP.settings.generateCompendiums.label',
            hint: 'EMP.settings.generateCompendiums.hint',
            icon: 'fa-solid fa-arrows-rotate',
            type: class extends FormApplication {
                constructor(...args) {
                    super(...args);
                    updateMacroCompendiums().then(() => {
                        ui.notifications.info("EMP: Standalone macros synced to compendium!");
                    }).catch((err) => {
                        ui.notifications.error(`EMP: Failed to sync compendiums: ${err.message}`);
                    });
                }
                render() { return this; }
            },
            restricted: true
        });
    }

    // World Scripts Configuration Menu
    game.settings.registerMenu(MODULE_ID, 'worldScripts', {
        name: 'EMP.settings.worldScripts.name',
        label: 'EMP.settings.worldScripts.label',
        icon: 'fa-solid fa-code',
        type: WorldScriptsFormApplication,
        restricted: true
    });

    // Register AA Autorec Update Menu
    game.settings.registerMenu(MODULE_ID, 'autorecUpdate', {
        name: 'EMP.settings.autorecUpdate.name',
        label: 'EMP.settings.autorecUpdate.label',
        hint: 'EMP.settings.autorecUpdate.hint',
        icon: 'fa-solid fa-wrench',
        type: autorecUpdateFormApplication,
        restricted: true
    });

    // Register BLFX Sync Menu
    game.settings.registerMenu(MODULE_ID, 'blfxSync', {
        name: 'EMP.settings.blfxSync.name',
        label: 'EMP.settings.blfxSync.label',
        hint: 'EMP.settings.blfxSync.hint',
        icon: 'fa-solid fa-dragon',
        type: BlfxAutorecUpdateFormApplication,
        restricted: true
    });

    // Destination target configuration: 'ask', 'autoanimations', 'blfx', 'none'
    game.settings.register(MODULE_ID, 'autorecTarget', {
        name: 'EMP.settings.autorecTarget.name',
        hint: 'EMP.settings.autorecTarget.hint',
        scope: 'world',
        config: true,
        type: String,
        choices: {
            'ask': 'EMP.settings.autorecTarget.choices.ask',
            'autoanimations': 'EMP.settings.autorecTarget.choices.autoanimations',
            'blfx': 'EMP.settings.autorecTarget.choices.blfx',
            'none': 'EMP.settings.autorecTarget.choices.none'
        },
        default: 'ask',
        onChange: (value) => log.info(`EMP | Autorec target setting updated to "${value}"`)
    });

    game.settings.register(MODULE_ID, 'enableSounds', {
        name: 'EMP.settings.enableSounds.name',
        hint: 'EMP.settings.enableSounds.hint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
    });

    game.settings.register(MODULE_ID, 'worldScriptsConfig', {
        scope: 'world',
        config: false,
        type: Object,
        default: {
            rollAnimation: false
        }
    });

    game.settings.register(MODULE_ID, 'autorecVersion', {
        scope: 'world',
        config: false,
        type: String,
        default: '0.0.0',
    });

    game.settings.register(MODULE_ID, 'blfxAutorecVersion', {
        scope: 'world',
        config: false,
        type: String,
        default: '0.0.0',
    });

    // Log Verbosity Level Setting
    game.settings.register(MODULE_ID, 'logVerbosity', {
        name: 'EMP.settings.logVerbosity.name',
        hint: 'EMP.settings.logVerbosity.hint',
        scope: 'client',
        config: true,
        type: String,
        choices: {
            'error': 'EMP.settings.logVerbosity.choices.error',
            'warn': 'EMP.settings.logVerbosity.choices.warn',
            'info': 'EMP.settings.logVerbosity.choices.info',
            'debug': 'EMP.settings.logVerbosity.choices.debug'
        },
        default: 'warn',
        onChange: (value) => log.setVerbosity(value)
    });
});

// Dynamic visibility of AA and BLFX buttons in settings config
Hooks.on('renderSettingsConfig', function(app, html, data) {
    const root = html instanceof jQuery ? html[0] : (html.querySelector ? html : html?.[0]);
    if (!root) return;

    const isAaActive = Boolean(game.modules?.get("autoanimations")?.active);
    const isBlfxActive = Boolean(
        game.modules?.get('boss-loot-assets-premium')?.active ||
        game.modules?.get('boss-loot-assets-free')?.active ||
        game.modules?.get('blfx')?.active ||
        Hooks.events?.['blfx.register.CustomAutoRec']
    );

    const target = game.settings?.get(MODULE_ID, 'autorecTarget') ?? 'ask';

    if (!isAaActive || target === 'blfx' || target === 'none') {
        root.querySelector(`[data-key="${MODULE_ID}.autorecUpdate"]`)?.closest('.form-group')?.remove();
    }
    if (!isBlfxActive || target === 'autoanimations' || target === 'none') {
        root.querySelector(`[data-key="${MODULE_ID}.blfxSync"]`)?.closest('.form-group')?.remove();
    }
});