import { MODULE_ID } from "./lib/constants.js";
import { RecommendedModulesFormApplication, WorldScriptsFormApplication, ConfigureAutorecFormApplication } from "./ui/index.js";
import { blfx, isBlfxAutorecAvailable } from "./adapters/modules/blfx/blfx-module-adapter.js";
import { updateMacroCompendiums } from "./lib/standalone-macros.js";
import { log } from './lib/logger.js';
import { adapter } from "./adapters/index.js";

/* Initialize Module Settings */
Hooks.once('init', function() {
    log.info('Initializing Eskie Macro Pack settings');

    const isDevBuild = game.modules?.get(MODULE_ID)?.version === "#{VERSION}#";

    // Recommended Modules Guide Menu
    game.settings.registerMenu(MODULE_ID, 'recommendedModules', {
        name: 'EMP.settings.recommendedModules.name',
        label: 'EMP.settings.recommendedModules.label',
        icon: 'fa-solid fa-puzzle-piece',
        type: RecommendedModulesFormApplication,
        restricted: false
    });

    // Configure Auto-Recognition Menu
    game.settings.registerMenu(MODULE_ID, 'configureAutorec', {
        name: 'EMP.settings.configureAutorec.name',
        label: 'EMP.settings.configureAutorec.label',
        hint: 'EMP.settings.configureAutorec.hint',
        icon: 'fa-solid fa-wand-magic-sparkles',
        type: ConfigureAutorecFormApplication,
        restricted: true
    });

    // Dev-only standalone macro compendium sync menu (enabled when version is #{VERSION}#)
    if (isDevBuild) {
        game.settings.registerMenu(MODULE_ID, 'generateCompendiums', {
            name: 'EMP.settings.generateCompendiums.name',
            label: 'EMP.settings.generateCompendiums.label',
            hint: 'EMP.settings.generateCompendiums.hint',
            icon: 'fa-solid fa-arrows-rotate',
            type: class extends (adapter.foundry.ApplicationV2 ?? class {}) {
                constructor(options = {}) {
                    super(options);
                    updateMacroCompendiums().then(() => {
                        ui.notifications?.info("EMP: Standalone macros synced to compendium!");
                    }).catch((err) => {
                        ui.notifications?.error(`EMP: Failed to sync compendiums: ${err.message}`);
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

    // Destination target configuration: 'ask', 'autoanimations', 'blfx', 'none'
    game.settings.register(MODULE_ID, 'autorecTarget', {
        name: 'EMP.settings.autorecTarget.name',
        hint: 'EMP.settings.autorecTarget.hint',
        scope: 'world',
        config: false,
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

// Dynamic visibility of Manage Autorec menu button in settings config
Hooks.on('renderSettingsConfig', function(app, html, data) {
    const root = html?.querySelector ? html : html?.[0];
    if (!root) return;

    const isAaActive = Boolean(game.modules?.get("autoanimations")?.active);
    const isBlfxActive = isBlfxAutorecAvailable();
    const hasActiveAutorec = isAaActive || isBlfxActive;

    if (!hasActiveAutorec) {
        root.querySelector(`[data-key="${MODULE_ID}.configureAutorec"]`)?.closest('.form-group')?.remove();
        root.querySelector(`[data-key="${MODULE_ID}.manageAutorec"]`)?.closest('.form-group')?.remove();
    }
});