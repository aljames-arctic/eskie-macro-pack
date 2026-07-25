import { MODULE_ID } from "./lib/constants.js";
import { autorecUpdateFormApplication } from "./integration/autoanimations/updateMenu.js";
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

    // Register AA Autorec Update Menu only if Automated Animations is active
    if (game.modules.get("autoanimations")?.active) {
        game.settings.registerMenu(MODULE_ID, 'autorecUpdate', {
            name: 'EMP.settings.autorecUpdate.name',
            label: 'EMP.settings.autorecUpdate.label',
            icon: 'fa-solid fa-wrench',
            type: autorecUpdateFormApplication,
            restricted: true
        });
    }

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

// Ensure AA Autorec Update button is hidden if Automated Animations is disabled
Hooks.on('renderSettingsConfig', function(app, html, data) {
    if (!game.modules.get("autoanimations")?.active) {
        const root = html instanceof jQuery ? html[0] : (html.querySelector ? html : html?.[0]);
        root?.querySelector(`[data-key="${MODULE_ID}.autorecUpdate"]`)?.closest('.form-group')?.remove();
    }
});