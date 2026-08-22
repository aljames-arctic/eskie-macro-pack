import { MODULE_ID } from "../../lib/constants.js";
import { log } from '../../lib/logger.js';
import { autoanimations } from "../autoanimations.js";
import { blfx } from "../blfx.js";

/**
 * Dialog prompting the GM to select which auto-recognition system Eskie Macro Pack should integrate with.
 */
export class AutorecDestinationDialog extends FormApplication {
    constructor(options = {}) {
        super({}, options);
        this.onSelectedCallback = options.onSelectedCallback ?? null;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["eskie-world-scripts-form", "eskie-autorec-destination-app"],
            popOut: true,
            template: `modules/${MODULE_ID}/src/integration/autorec/destinationDialog.html`,
            id: "empAutorecDestinationDialog",
            title: "EMP.autorecManager.menuTitle",
            width: 580,
            height: "auto",
            closeOnSubmit: true
        });
    }

    async getData() {
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

    activateListeners(html) {
        super.activateListeners(html);

        // Highlight selected card visually
        html.find('input[name="autorecTarget"]').on('change', (event) => {
            html.find('.eskie-script-card').removeClass('active');
            $(event.currentTarget).closest('.eskie-script-card').addClass('active');
        });

        html.find('button[name="cancel"]').on('click', () => {
            this.close();
        });
    }

    async _updateObject(event, formData) {
        const target = formData?.autorecTarget ?? 'none';
        const remember = Boolean(formData?.rememberChoice);

        log.info(`EMP | Autorec integration destination selected: "${target}" (remember: ${remember})`);

        if (remember && game.settings) {
            await game.settings.set(MODULE_ID, 'autorecTarget', target);
        }

        if (this.onSelectedCallback) {
            await this.onSelectedCallback(target);
        } else {
            if (target === 'autoanimations') {
                await autoanimations.submit();
            } else if (target === 'blfx') {
                await blfx.submit(true);
            }
        }
    }
}
