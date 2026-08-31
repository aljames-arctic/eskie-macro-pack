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

    // Recommended Modules Guide Menu (View Companion Modules)
    game.settings.registerMenu(MODULE_ID, 'recommendedModules', {
        name: 'EMP.settings.recommendedModules.name',
        label: 'EMP.settings.recommendedModules.label',
        icon: 'fa-solid fa-puzzle-piece',
        type: RecommendedModulesFormApplication,
        restricted: true
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
        default: 'debug',
        onChange: (value) => log.setVerbosity(value)
    });
});

/**
 * Injects structured World, User, and Client section headers into SettingsConfig
 * and ensures user-scoped menus (like recommendedModules) are grouped cleanly.
 *
 * @param {HTMLElement|jQuery} html - The settings config DOM element
 * @param {object} [_app=null] - The settings application instance
 */
export function injectSettingsHeaders(html, _app = null) {
    const root = html?.querySelector ? html : html?.[0];
    if (!root?.querySelector) return;

    // 1. Ensure generateCompendiums (Dev Menu) is at the very top of World Settings if present
    const genCompSelector = [
        `[data-key="${MODULE_ID}.generateCompendiums"]`,
        `[data-action="${MODULE_ID}.generateCompendiums"]`,
        `[data-setting-id="${MODULE_ID}.generateCompendiums"]`,
        `[data-entry-id="${MODULE_ID}.generateCompendiums"]`,
        `[data-key="generateCompendiums"]`,
        `[data-action="generateCompendiums"]`
    ].join(', ');

    const genCompEl = root.querySelector(genCompSelector);
    if (genCompEl) {
        const genCompFg = genCompEl.closest('.form-group') ?? genCompEl;
        const parent = genCompFg?.parentNode;
        const firstEl = parent?.firstElementChild ?? parent?.children?.[0];
        if (parent && firstEl && firstEl !== genCompFg) {
            if (firstEl.classList?.contains('emp-settings-section-header') && firstEl.dataset?.scope === 'world') {
                if (firstEl.nextElementSibling !== genCompFg) {
                    parent.insertBefore(genCompFg, firstEl.nextElementSibling);
                }
            } else {
                parent.insertBefore(genCompFg, firstEl);
            }
        }
    }

    // 2. Insert section headers before the respective first setting in each scope
    const sections = [
        {
            keys: ['generateCompendiums', 'recommendedModules', 'configureAutorec', 'manageAutorec', 'worldScripts', 'enableSounds'],
            scope: 'world',
            title: game.i18n?.localize?.('EMP.settingsSections.world') ?? 'World Settings',
            icon: 'fas fa-globe'
        },
        {
            keys: [],
            scope: 'user',
            title: game.i18n?.localize?.('EMP.settingsSections.user') ?? 'User Settings',
            icon: 'fas fa-user'
        },
        {
            keys: ['logVerbosity'],
            scope: 'client',
            title: game.i18n?.localize?.('EMP.settingsSections.client') ?? 'Client Settings',
            icon: 'fas fa-desktop'
        }
    ];

    for (const section of sections) {
        let targetEl = null;
        for (const key of section.keys) {
            const selector = [
                `[data-setting-id="${MODULE_ID}.${key}"]`,
                `[data-entry-id="${MODULE_ID}.${key}"]`,
                `[name="${MODULE_ID}.${key}"]`,
                `[data-key="${MODULE_ID}.${key}"]`,
                `[data-action="${MODULE_ID}.${key}"]`,
                `[data-setting-id="${key}"]`,
                `[data-entry-id="${key}"]`,
                `[name="${key}"]`,
                `[data-key="${key}"]`,
                `[data-action="${key}"]`
            ].join(', ');
            targetEl = root.querySelector(selector);
            if (targetEl) break;
        }

        if (!targetEl) continue;

        const formGroup = targetEl.closest('.form-group') ?? targetEl;
        const parent = formGroup?.parentNode;
        if (!formGroup || !parent) continue;

        // Ensure we don't insert duplicate headers
        const existing = parent.querySelector?.(`.emp-settings-section-header[data-scope="${section.scope}"]`);
        if (existing) continue;

        const prev = formGroup.previousElementSibling;
        if (prev?.classList?.contains('emp-settings-section-header') && prev?.dataset?.scope === section.scope) {
            continue;
        }

        const header = document.createElement('div');
        header.className = 'emp-settings-section-header';
        header.dataset.scope = section.scope;
        header.innerHTML = `<i class="${section.icon}"></i><span>${section.title}</span>`;
        parent.insertBefore(header, formGroup);
    }
}

// Dynamic visibility of Manage Autorec menu button and settings headers injection
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

    injectSettingsHeaders(html, app);
});