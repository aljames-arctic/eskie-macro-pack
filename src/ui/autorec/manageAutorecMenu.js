import { MODULE_ID } from "../../lib/constants.js";
import { log } from '../../lib/logger.js';
import { BaseFoundryAdapter } from "../../adapters/foundry/index.js";
import { autorecUpdateFormApplication } from "../autoanimations/updateMenu.js";
import { BlfxAutorecUpdateFormApplication, generateBlfxAutorecUpdate } from "../blfx/updateMenu.js";
import {
    isBlfxAutorecAvailable,
    isBlfxCustomAutoRecUpdatesEnabled,
    promptEnableBlfxUpdates,
    blfxAdapter
} from "../../adapters/modules/blfx/blfx-module-adapter.js";

const foundryPlatform = new BaseFoundryAdapter();

/**
 * Modern ApplicationV2 menu for configuring Eskie Macro Pack auto-recognition integrations,
 * configuring target destinations via dropdown, and triggering preset sync submenus across
 * Automated Animations (AA) and Boss Loot FX (BLFX).
 */
export class ConfigureAutorecApp extends foundryPlatform.HandlebarsApplicationMixin(foundryPlatform.ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.onSelectedCallback = options.onSelectedCallback ?? null;
    }

    static DEFAULT_OPTIONS = {
        id: "empConfigureAutorecMenu",
        classes: ["eskie-world-scripts-form", "eskie-autorec-destination-app", "eskie-manage-autorec-app"],
        tag: "form",
        window: {
            title: "EMP.configureAutorec.menuTitle"
        },
        position: {
            width: 600,
            height: "auto"
        },
        form: {
            handler: ConfigureAutorecApp._formHandler,
            closeOnSubmit: true
        }
    };

    static get PARTS() {
        return {
            form: {
                template: `modules/${MODULE_ID}/src/ui/autorec/manageAutorecMenu.html`
            }
        };
    }

    async _prepareContext(options) {
        const isAaActive = Boolean(game.modules?.get('autoanimations')?.active);
        const isBlfxActive = isBlfxAutorecAvailable();

        const activeCount = (isAaActive ? 1 : 0) + (isBlfxActive ? 1 : 0);
        const hasActiveAutorec = activeCount >= 1;
        const hasMultipleAutorec = activeCount >= 2;

        let currentTarget = game.settings?.get(MODULE_ID, 'autorecTarget') ?? 'ask';
        if (currentTarget === 'ask' && !hasMultipleAutorec) {
            if (isAaActive) currentTarget = 'autoanimations';
            else if (isBlfxActive) currentTarget = 'blfx';
            else currentTarget = 'none';
        }

        return {
            currentTarget,
            isAaActive,
            isBlfxActive,
            hasActiveAutorec,
            hasMultipleAutorec
        };
    }

    _onRender(context, options) {
        super._onRender?.(context, options);

        // Sync AA submenu button handler
        const syncAaBtn = this.element?.querySelector('button[name="syncAa"]');
        syncAaBtn?.addEventListener('click', (event) => {
            event.preventDefault();
            new autorecUpdateFormApplication().render(true);
        });

        // Sync BLFX submenu button handler
        const syncBlfxBtn = this.element?.querySelector('button[name="syncBlfx"]');
        syncBlfxBtn?.addEventListener('click', async (event) => {
            event.preventDefault();
            const { missingEntries, updatedEntries, customEntries } = await generateBlfxAutorecUpdate(blfxAdapter.registry);
            const hasChanges = Boolean(missingEntries.length || updatedEntries.length || customEntries.length);
            if (hasChanges && !isBlfxCustomAutoRecUpdatesEnabled()) {
                await promptEnableBlfxUpdates();
                return;
            }
            new BlfxAutorecUpdateFormApplication().render(true);
        });

        // Cancel/Close button handler
        const cancelBtn = this.element?.querySelector('button[name="cancel"]');
        cancelBtn?.addEventListener('click', (event) => {
            event.preventDefault();
            this.close();
        });
    }

    static async _formHandler(event, form, formData) {
        const isCancel = event.submitter && event.submitter.name === "cancel";
        if (isCancel) return;

        const rawData = formData.object ?? formData;
        const target = rawData?.autorecTarget
            ?? form?.querySelector?.('select[name="autorecTarget"]')?.value
            ?? form?.querySelector?.('input[name="autorecTarget"]:checked')?.value;

        if (target && game.settings) {
            await game.settings.set(MODULE_ID, 'autorecTarget', target);
            log.info(`EMP | Autorec integration destination updated: "${target}"`);
            const msg = game.i18n?.localize?.("EMP.configureAutorec.savedNotify") ?? "Auto-recognition settings saved.";
            ui.notifications?.info?.(msg);
        }

        const appInstance = this;
        if (appInstance?.onSelectedCallback && target) {
            await appInstance.onSelectedCallback(target);
        }
    }
}

export {
    ConfigureAutorecApp as ConfigureAutorecFormApplication,
    ConfigureAutorecApp as ConfigureAutorecDialog,
    ConfigureAutorecApp as ManageAutorecApp,
    ConfigureAutorecApp as ManageAutorecFormApplication,
    ConfigureAutorecApp as ManageAutorecDialog,
    ConfigureAutorecApp as AutorecDestinationDialog,
    ConfigureAutorecApp as destinationDialog
};
