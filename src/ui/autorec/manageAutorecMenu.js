import { MODULE_ID } from "../../lib/constants.js";
import { log } from '../../lib/logger.js';
import { BaseFoundryAdapter } from "../../adapters/foundry/index.js";
import { autorecUpdateFormApplication } from "../autoanimations/updateMenu.js";
import { BlfxAutorecUpdateFormApplication } from "../blfx/updateMenu.js";

const foundryPlatform = new BaseFoundryAdapter();

/**
 * Modern ApplicationV2 menu for managing Eskie Macro Pack auto-recognition integrations,
 * configuring targets across Automated Animations (AA) and Boss Loot FX (BLFX), and triggering preset syncs.
 */
export class ManageAutorecApp extends foundryPlatform.HandlebarsApplicationMixin(foundryPlatform.ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.onSelectedCallback = options.onSelectedCallback ?? null;
    }

    static DEFAULT_OPTIONS = {
        id: "empManageAutorecMenu",
        classes: ["eskie-world-scripts-form", "eskie-autorec-destination-app", "eskie-manage-autorec-app"],
        tag: "form",
        window: {
            title: "EMP.manageAutorec.menuTitle"
        },
        position: {
            width: 620,
            height: "auto"
        },
        form: {
            handler: ManageAutorecApp._formHandler,
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
        const isBlfxActive = Boolean(
            game.modules?.get('boss-loot-assets-premium')?.active ||
            game.modules?.get('boss-loot-assets-free')?.active ||
            game.modules?.get('blfx')?.active ||
            Hooks.events?.['blfx.register.CustomAutoRec']
        );

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

        // Highlight selected target card visually
        this.element?.querySelectorAll?.('input[name="autorecTarget"]').forEach(input => {
            input.addEventListener('change', (event) => {
                this.element?.querySelectorAll('.eskie-autorec-target-section .eskie-script-card').forEach(card => card.classList.remove('active'));
                event.currentTarget.closest('.eskie-script-card')?.classList.add('active');
            });
        });

        // Sync AA button handler
        const syncAaBtn = this.element?.querySelector('button[name="syncAa"]');
        syncAaBtn?.addEventListener('click', (event) => {
            event.preventDefault();
            new autorecUpdateFormApplication().render(true);
        });

        // Sync BLFX button handler
        const syncBlfxBtn = this.element?.querySelector('button[name="syncBlfx"]');
        syncBlfxBtn?.addEventListener('click', (event) => {
            event.preventDefault();
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
        const target = rawData?.autorecTarget ?? form?.querySelector?.('input[name="autorecTarget"]:checked')?.value;

        if (target && game.settings) {
            await game.settings.set(MODULE_ID, 'autorecTarget', target);
            log.info(`EMP | Autorec integration destination updated: "${target}"`);
            const msg = game.i18n?.localize?.("EMP.manageAutorec.savedNotify") ?? "Auto-recognition settings saved.";
            ui.notifications?.info?.(msg);
        }

        const appInstance = this;
        if (appInstance?.onSelectedCallback && target) {
            await appInstance.onSelectedCallback(target);
        }
    }
}

export {
    ManageAutorecApp as ManageAutorecFormApplication,
    ManageAutorecApp as ManageAutorecDialog,
    ManageAutorecApp as AutorecDestinationDialog,
    ManageAutorecApp as destinationDialog
};
