import { MODULE_ID } from "../../lib/constants.js";
import { updateWorldScripts } from "../../world-scripts/loader.js";
import { log } from '../../lib/logger.js';
import { adapter } from '../../adapters/index.js';

export const WORLD_SCRIPTS_REGISTRY = [
    {
        id: "rollAnimation",
        name: "EMP.worldScripts.rollAnimation.name",
        description: "EMP.worldScripts.rollAnimation.hint",
        icon: "fa-solid fa-dice-d20"
    }
];

export class WorldScriptsApp extends (adapter.foundry.HandlebarsApplicationMixin(adapter.foundry.ApplicationV2) as any) {
    static DEFAULT_OPTIONS = {
        id: "eskie-world-scripts-menu",
        classes: ["eskie-world-scripts-form"],
        tag: "form",
        window: {
            title: "EMP.worldScripts.menuTitle"
        },
        position: {
            width: 580,
            height: "auto"
        },
        form: {
            handler: WorldScriptsApp._formHandler,
            closeOnSubmit: true
        }
    };

    static get PARTS() {
        return {
            form: {
                template: `modules/${MODULE_ID}/src/ui/world-scripts/worldScriptsMenu.html`
            }
        };
    }

    async _prepareContext(options: any): Promise<any> {
        const currentConfig = game.settings?.get(MODULE_ID, "worldScriptsConfig") ?? {};
        const activeSystem = game.system?.title ?? "";

        const scripts = WORLD_SCRIPTS_REGISTRY.map(script => {
            const data: Record<string, any> = {
                ...script,
                name: game.i18n?.localize?.(script.name) ?? script.name,
                description: game.i18n?.localize?.(script.description) ?? script.description,
                enabled: Boolean(currentConfig[script.id])
            };
            // Dynamically attach the auto-detected system name to the roll animations script
            if (script.id === "rollAnimation") {
                data.badge = activeSystem;
            }
            return data;
        });

        return {
            scripts,
            menuHint: game.i18n?.localize?.("EMP.worldScripts.menuHint") ?? ""
        };
    }

    _onRender(context: any, options: any) {
        (super._onRender as any)?.(context, options);

        // Instantly toggle the .active class on the card when the checkbox changes for real-time visual feedback
        this.element?.querySelectorAll?.(".eskie-switch input").forEach((input: any) => {
            input.addEventListener("change", (event: any) => {
                const checkbox = event.currentTarget as HTMLInputElement | null;
                const card = checkbox?.closest(".eskie-script-card");
                if (card && checkbox) {
                    card.classList.toggle("active", checkbox.checked);
                }
            });
        });
    }

    static async _formHandler(this: any, event: any, form: any, formData: any) {
        const rawData = formData.object ?? formData;
        const config: Record<string, any> = {};
        for (const script of WORLD_SCRIPTS_REGISTRY) {
            const input = form?.querySelector ? form.querySelector(`input[name="${script.id}"]`) : null;
            config[script.id] = input ? input.checked : Boolean(rawData?.[script.id]);
        }
        log.info("Saving World Scripts Configuration:", config);

        // 1. Save the settings object
        if (game.settings) {
            await game.settings.set(MODULE_ID, "worldScriptsConfig", config);
        }

        // 2. Dynamically enable/disable scripts in real-time (no page reload required!)
        updateWorldScripts();

        // 3. Show a friendly notification
        ui.notifications.info(game.i18n?.localize?.("EMP.worldScripts.savedNotify") ?? "World Scripts Saved");
    }
}

export { WorldScriptsApp as WorldScriptsFormApplication };
