import { MODULE_ID } from "../../lib/constants.js";
import { EMP_AA_Menu } from "../../adapters/modules/autoanimations/autoanimations-module-adapter.js";
import { log } from '../../lib/logger.js';
import { BaseFoundryAdapter } from '../../adapters/foundry/index.js';

const foundryPlatform = new BaseFoundryAdapter();

export async function generateAutorecUpdate(autorec, excludedIds = new Set()) {
    log.group("Autorecognition Menu Check", 'debug');
    let settings = {};
    const menuKeys = ["melee", "range", "ontoken", "templatefx", "preset", "aura", "aefx"];
    for (const key of menuKeys) {
        settings[key] = [...new Map(await game.settings.get("autoanimations", `aaAutorec-${key}`).map((v) => [v.id, v])).values()];
    }

    let updatedEntries = { melee: [], range: [], ontoken: [], templatefx: [], aura: [], preset: [], aefx: [] };
    let missingEntries = { melee: [], range: [], ontoken: [], templatefx: [], aura: [], preset: [], aefx: [] };
    let custom = { melee: [], range: [], ontoken: [], templatefx: [], aura: [], preset: [], aefx: [] };
    let same = { melee: [], range: [], ontoken: [], templatefx: [], aura: [], preset: [], aefx: [] };
    let customNew = { melee: [], range: [], ontoken: [], templatefx: [], aura: [], preset: [], aefx: [] };

    // 1st Loop - Check incoming animations against existing settings
    for (const key of menuKeys) {
        if (!autorec[key] || !Array.isArray(autorec[key])) continue;
        autorec[key].forEach(newEntry => {
            const existingEntry = settings[key]?.find(e => e.label === newEntry.label);
            if (existingEntry) {
                if (existingEntry.metaData?.name === "Eskie Macro Pack") {
                    if (foundryPlatform.isNewerVersion(newEntry.metaData.version, existingEntry.metaData.version ?? "0.0.0")) {
                        updatedEntries[key].push(newEntry);
                    } else {
                        same[key].push(existingEntry);
                    }
                } else {
                    custom[key].push(existingEntry); // This is a conflict
                }
            } else {
                missingEntries[key].push(newEntry);
            }
        });
    }

    // 2nd Loop - Check existing settings for custom animations to preserve
    for (const key of menuKeys) {
        if (!settings[key] || !Array.isArray(settings[key])) continue;
        settings[key].forEach(existingEntry => {
            const isConflict = custom[key].some(e => e.id === existingEntry.id);
            if (isConflict) return;

            const isSame = same[key].some(e => e.id === existingEntry.id);
            if (isSame) return;

            const isInNew = autorec[key]?.some(e => e.label === existingEntry.label);
            if (isInNew) return; 

            if (existingEntry.metaData?.name !== "Eskie Macro Pack") {
                 customNew[key].push(existingEntry);
            }
        });
    }

    log.debug("The following effects did not exist before. They will be ADDED.", missingEntries);
    log.debug("The following effects will be UPDATED to a new version.", updatedEntries);
    log.debug("The following effects are already up-to-date.", same);
    log.debug("The following effects cannot be added or updated, due to a name conflict with an effect from another source. They will be IGNORED.", custom);
    log.debug("The following custom effects will be preserved.", customNew);
    log.groupEnd();
    
    // Create structured lists for the dialog
    const formatEntry = (e) => ({ id: e.id, label: e.label, menu: e.menu || "preset" });
    const missingEntriesList = Object.values(missingEntries).flat().map(formatEntry).sort((a, b) => a.label.localeCompare(b.label));
    const updatedEntriesList = Object.values(updatedEntries).flat().map(formatEntry).sort((a, b) => a.label.localeCompare(b.label));
    const customEntriesList = Object.values(custom).flat().map(formatEntry).sort((a, b) => a.label.localeCompare(b.label));

    // Construct the new settings that will be saved (filtering out excluded missing entries)
    let newSettings = {};
    for (const key of menuKeys) {
        const missingForCategory = (missingEntries[key] ?? []).filter(e => !excludedIds.has(e.id));
        const newEntriesForKey = [
            ...missingForCategory,
            ...(updatedEntries[key] ?? []),
            ...(custom[key] ?? []),
            ...(same[key] ?? []),
            ...(customNew[key] ?? []),
        ];
        newSettings[key] = [...new Map(newEntriesForKey.map((v) => [v.id, v])).values()].sort((a, b) => (a.label || "").localeCompare(b.label || ""));
    }
    newSettings.version = (await game.settings.get("autoanimations", "aaAutorec"))?.version ?? "0.0.0";

    return {
        newSettings,
        missingEntriesList,
        updatedEntriesList,
        customEntriesList,
    };
}

/**
 * Interactive ApplicationV2 for reviewing and synchronizing Automated Animations custom auto-recognition presets.
 */
export class AutorecUpdateApp extends foundryPlatform.HandlebarsApplicationMixin(foundryPlatform.ApplicationV2) {
    constructor(autorec = EMP_AA_Menu, options = {}) {
        super(options);
        this.autorec = autorec ?? EMP_AA_Menu;
    }

    static DEFAULT_OPTIONS = {
        id: "empAutorecUpdateMenu",
        classes: ["eskie-world-scripts-form", "eskie-aa-update-form"],
        tag: "form",
        window: {
            title: "EMP.updateMenu.menuTitle"
        },
        position: {
            width: 640,
            height: "auto"
        },
        form: {
            handler: AutorecUpdateApp._formHandler,
            closeOnSubmit: true
        }
    };

    static get PARTS() {
        return {
            form: {
                template: `modules/${MODULE_ID}/src/ui/autoanimations/autorecUpdateMenu.html`
            }
        };
    }

    async settings(excludedIds = new Set()) {
        return await generateAutorecUpdate(this.autorec, excludedIds);
    }

    async _prepareContext(options) {
        const {
            missingEntriesList,
            updatedEntriesList,
            customEntriesList,
        } = await this.settings();

        const hasChanges = Boolean(missingEntriesList.length || updatedEntriesList.length || customEntriesList.length);

        return {
            missingEntries: missingEntriesList,
            updatedEntries: updatedEntriesList,
            customEntries: customEntriesList,
            hasChanges
        };
    }

    _onRender(context, options) {
        super._onRender?.(context, options);
        const cancelBtn = this.element?.querySelector('button[name="cancel"]');
        cancelBtn?.addEventListener('click', async (event) => {
            event.preventDefault();
            const rawVersion = game.modules?.get(MODULE_ID)?.version ?? "1.0.0";
            if (rawVersion !== "#{VERSION}#" && game.settings) {
                await game.settings.set(MODULE_ID, "autorecVersion", rawVersion);
            }
            this.close();
        });
    }

    static async _formHandler(event, form, formData) {
        const isCancel = event.submitter && event.submitter.name === "cancel";
        if (isCancel) {
            const rawVersion = game.modules?.get(MODULE_ID)?.version ?? "1.0.0";
            if (rawVersion !== "#{VERSION}#" && game.settings) {
                await game.settings.set(MODULE_ID, "autorecVersion", rawVersion);
            }
            return;
        }

        log.group("Autorecognition Menu Update");

        const excludedIds = new Set();
        const checkboxes = form?.querySelectorAll ? form.querySelectorAll('input[type="checkbox"][name^="missing_"]') : [];
        if (checkboxes.length) {
            for (const cb of checkboxes) {
                if (!cb.checked) {
                    const entryId = cb.name.replace("missing_", "");
                    excludedIds.add(entryId);
                }
            }
        } else {
            const rawData = formData.object ?? formData;
            if (rawData) {
                for (const [key, value] of Object.entries(rawData)) {
                    if (key.startsWith("missing_") && !value) {
                        const entryId = key.replace("missing_", "");
                        excludedIds.add(entryId);
                    }
                }
            }
        }

        const appInstance = this;
        const { newSettings } = appInstance?.settings ? await appInstance.settings(excludedIds) : await generateAutorecUpdate(EMP_AA_Menu, excludedIds);
        if (!newSettings || Object.keys(newSettings).length === 0) {
            log.debug("Nothing to update!");
            const rawVersion = game.modules?.get(MODULE_ID)?.version ?? "1.0.0";
            if (rawVersion !== "#{VERSION}#" && game.settings) {
                await game.settings.set(MODULE_ID, "autorecVersion", rawVersion);
            }
            log.groupEnd();
            return;
        }

        if (AutomatedAnimations?.AutorecManager?.overwriteMenus) {
            await AutomatedAnimations.AutorecManager.overwriteMenus(JSON.stringify(newSettings), { submitAll: true });
        }

        const rawVersion = game.modules?.get(MODULE_ID)?.version ?? "1.0.0";
        const isDevelopment = rawVersion === "#{VERSION}#";
        const effectiveVersion = isDevelopment ? `${rawVersion}.${Date.now()}` : rawVersion;

        if (game.settings?.settings?.has?.(`${MODULE_ID}.autorecVersion`)) {
            await game.settings.set(MODULE_ID, "autorecVersion", effectiveVersion);
        }

        log.info("Animations have been updated in Automated Animations.");
        log.groupEnd();
    }
}

export { AutorecUpdateApp as autorecUpdateFormApplication };
