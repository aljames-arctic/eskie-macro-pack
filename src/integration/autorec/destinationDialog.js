import { MODULE_ID } from "../../lib/constants.js";
import { log } from '../../lib/logger.js';
import { autoanimations } from "../autoanimations.js";
import { blfx } from "../blfx.js";
import { adapter } from "../../adapters/index.js";

/**
 * Modern ApplicationV2 Dialog prompting the GM to select which auto-recognition system Eskie Macro Pack should integrate with.
 */
export class AutorecDestinationDialog extends adapter.foundry.HandlebarsApplicationMixin(adapter.foundry.ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this.onSelectedCallback = options.onSelectedCallback ?? null;
    }

    static DEFAULT_OPTIONS = {
        id: "empAutorecDestinationDialog",
        classes: ["eskie-world-scripts-form", "eskie-autorec-destination-app"],
        tag: "form",
        window: {
            title: "EMP.autorecManager.menuTitle"
        },
        position: {
            width: 580,
            height: "auto"
        },
        form: {
            handler: AutorecDestinationDialog._formHandler,
            closeOnSubmit: true
        }
    };

    static get PARTS() {
        return {
            form: {
                template: `modules/${MODULE_ID}/src/integration/autorec/destinationDialog.html`
            }
        };
    }

    async _prepareContext(options) {
        const isAaInstalled = Boolean(game.modules?.get('autoanimations'));
        const isAaActive = Boolean(game.modules?.get('autoanimations')?.active);

        const isBlfxInstalled = Boolean(
            game.modules?.get('boss-loot-assets-premium') ||
            game.modules?.get('boss-loot-assets-free') ||
            game.modules?.get('blfx')
        );
        const isBlfxActive = Boolean(
            game.modules?.get('boss-loot-assets-premium')?.active ||
            game.modules?.get('boss-loot-assets-free')?.active ||
            game.modules?.get('blfx')?.active ||
            Hooks.events?.['blfx.register.CustomAutoRec']
        );

        let currentTarget = game.settings?.get(MODULE_ID, 'autorecTarget') ?? 'ask';
        if (currentTarget === 'ask') {
            if (isAaActive && !isBlfxActive) currentTarget = 'autoanimations';
            else if (isBlfxActive && !isAaActive) currentTarget = 'blfx';
            else if (isAaActive) currentTarget = 'autoanimations';
            else currentTarget = 'none';
        }

        return {
            currentTarget,
            isAaInstalled,
            isAaActive,
            isBlfxInstalled,
            isBlfxActive
        };
    }

    _onRender(context, options) {
        super._onRender?.(context, options);

        // Highlight selected card visually
        this.element?.querySelectorAll?.('input[name="autorecTarget"]').forEach(input => {
            input.addEventListener('change', (event) => {
                this.element?.querySelectorAll('.eskie-script-card').forEach(card => card.classList.remove('active'));
                event.currentTarget.closest('.eskie-script-card')?.classList.add('active');
            });
        });

        const cancelBtn = this.element?.querySelector('button[name="cancel"]');
        cancelBtn?.addEventListener('click', (event) => {
            event.preventDefault();
            this.close();
        });
    }

    static async _formHandler(event, form, formData) {
        const isCancel = event.submitter && event.submitter.name === "cancel";
        if (isCancel) return;

        const appInstance = (this instanceof AutorecDestinationDialog) ? this : (form?.app ?? null);
        const rawData = formData.object ?? formData;
        const target = rawData?.autorecTarget ?? form?.querySelector?.('input[name="autorecTarget"]:checked')?.value ?? 'none';
        const remember = Boolean(rawData?.rememberChoice ?? form?.querySelector?.('input[name="rememberChoice"]')?.checked);

        log.info(`EMP | Autorec integration destination selected: "${target}" (remember: ${remember})`);

        if (remember && game.settings) {
            await game.settings.set(MODULE_ID, 'autorecTarget', target);
        }

        if (appInstance?.onSelectedCallback) {
            await appInstance.onSelectedCallback(target);
        } else {
            if (target === 'autoanimations') {
                await autoanimations.submit();
            } else if (target === 'blfx') {
                await blfx.submit(true);
            }
        }
    }
}

export { AutorecDestinationDialog as destinationDialog };
