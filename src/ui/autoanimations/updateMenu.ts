import { MODULE_ID } from "../../lib/constants.js";
import { EMP_AA_Menu } from "../../adapters/modules/autoanimations/autoanimations-module-adapter.js";
import { log } from '../../lib/logger.js';
import { BaseFoundryAdapter } from '../../adapters/foundry/index.js';

const foundryPlatform = new BaseFoundryAdapter();

export async function generateAutorecUpdate(autorec: any, excludedIds: any = new Set()) {
    log.group("Autorecognition Menu Check", 'debug');
    let settings: Record<string, any[]> = {};
    const menuKeys = ["melee", "range", "ontoken", "templatefx", "preset", "aura", "aefx"];
    for (const key of menuKeys) {
        settings[key] = [...new Map((await (game.settings as any).get("autoanimations", `aaAutorec-${key}`)).map((v: any) => [v.id, v])).values()];
    }

    let updatedEntries: Record<string, any[]> = { melee: [], range: [], ontoken: [], templatefx: [], aura: [], preset: [], aefx: [] };
    let missingEntries: Record<string, any[]> = { melee: [], range: [], ontoken: [], templatefx: [], aura: [], preset: [], aefx: [] };
    let custom: Record<string, any[]> = { melee: [], range: [], ontoken: [], templatefx: [], aura: [], preset: [], aefx: [] };
    let same: Record<string, any[]> = { melee: [], range: [], ontoken: [], templatefx: [], aura: [], preset: [], aefx: [] };
    let customNew: Record<string, any[]> = { melee: [], range: [], ontoken: [], templatefx: [], aura: [], preset: [], aefx: [] };

    // 1st Loop - Check incoming animations against existing settings
    for (const key of menuKeys) {
        if (!autorec[key] || !Array.isArray(autorec[key])) continue;
        autorec[key].forEach((newEntry: any) => {
            const existingEntry = settings[key]?.find((e: any) => e.label === newEntry.label);
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
        settings[key].forEach((existingEntry: any) => {
            const isConflict = custom[key].some((e: any) => e.id === existingEntry.id);
            if (isConflict) return;

            const isSame = same[key].some((e: any) => e.id === existingEntry.id);
            if (isSame) return;

            const isInNew = autorec[key]?.some((e: any) => e.label === existingEntry.label);
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
    const formatEntry = (e: any) => ({ id: e.id, label: e.label, menu: e.menu || "preset" });
    const missingEntriesList = Object.values(missingEntries).flat().map(formatEntry).sort((a: any, b: any) => a.label.localeCompare(b.label));
    const updatedEntriesList = Object.values(updatedEntries).flat().map(formatEntry).sort((a: any, b: any) => a.label.localeCompare(b.label));
    const customEntriesList = Object.values(custom).flat().map(formatEntry).sort((a: any, b: any) => a.label.localeCompare(b.label));

    const missingSections = groupAAEntriesBySection(missingEntries);
    const updatedSections = groupAAEntriesBySection(updatedEntries);
    const customSections = groupAAEntriesBySection(custom);

    // Construct the new settings that will be saved (filtering out excluded missing entries)
    let newSettings: Record<string, any> = {};
    for (const key of menuKeys) {
        const missingForCategory = (missingEntries[key] ?? []).filter((e: any) => !excludedIds.has(e.id));
        const newEntriesForKey = [
            ...missingForCategory,
            ...(updatedEntries[key] ?? []),
            ...(custom[key] ?? []),
            ...(same[key] ?? []),
            ...(customNew[key] ?? []),
        ];
        // Deduplicate EMP entries by label to eliminate any legacy duplicates
        const seenEmpLabels = new Set();
        const deduplicatedEntries: any[] = [];
        for (const entry of newEntriesForKey) {
            if (entry.metaData?.name === "Eskie Macro Pack") {
                if (seenEmpLabels.has(entry.label)) continue;
                seenEmpLabels.add(entry.label);
            }
            deduplicatedEntries.push(entry);
        }
        newSettings[key] = [...new Map(deduplicatedEntries.map((v: any) => [v.id, v])).values()].sort((a: any, b: any) => (a.label ?? "").localeCompare(b.label ?? ""));
    }
    newSettings.version = (await (game.settings as any).get("autoanimations", "aaAutorec"))?.version ?? "0.0.0";

    return {
        newSettings,
        missingEntriesList,
        updatedEntriesList,
        customEntriesList,
        missingSections,
        updatedSections,
        customSections,
    };
}

/**
 * Standard configuration for Automated Animations categories and display order.
 */
export const AA_SECTION_CONFIG = [
    { id: "melee", name: "Melee Attacks", icon: "fa-solid fa-hand-fist" },
    { id: "range", name: "Ranged Attacks", icon: "fa-solid fa-bullseye" },
    { id: "ontoken", name: "On Token", icon: "fa-solid fa-user" },
    { id: "templatefx", name: "Templates", icon: "fa-solid fa-shapes" },
    { id: "aura", name: "Auras", icon: "fa-solid fa-sun" },
    { id: "aefx", name: "Active Effects", icon: "fa-solid fa-wand-magic-sparkles" },
    { id: "preset", name: "Presets", icon: "fa-solid fa-film" }
];

/**
 * Groups AA entries into standardized visual sections matching the BLFX menu structure.
 * @param {object} entriesByCategory Dictionary of arrays keyed by AA category
 * @returns {Array<{sectionId: string, sectionName: string, icon: string, entries: Array<object>}>}
 */
export function groupAAEntriesBySection(entriesByCategory: any = {}) {
    const sections: any[] = [];
    for (const conf of AA_SECTION_CONFIG) {
        const rawEntries = entriesByCategory[conf.id] ?? [];
        if (!rawEntries.length) continue;

        const entries = rawEntries.map((e: any) => ({
            id: e.id,
            label: e.label,
            menu: conf.id,
            version: e.metaData?.version ?? "0.0.0"
        })).sort((a: any, b: any) => a.label.localeCompare(b.label));

        sections.push({
            sectionId: conf.id,
            sectionName: conf.name,
            icon: conf.icon,
            entries
        });
    }
    return sections;
}

/**
 * Interactive ApplicationV2 for reviewing and synchronizing Automated Animations custom auto-recognition presets.
 */
export class AutorecUpdateApp extends (foundryPlatform.HandlebarsApplicationMixin(foundryPlatform.ApplicationV2) as any) {
    autorec: any;

    constructor(autorec = EMP_AA_Menu, options: any = {}) {
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
            width: 980,
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

    async _prepareContext(options: any): Promise<any> {
        const {
            missingEntriesList,
            updatedEntriesList,
            customEntriesList,
            missingSections,
            updatedSections,
            customSections,
        } = await this.settings();

        const hasChanges = Boolean(missingEntriesList?.length || updatedEntriesList?.length || customEntriesList?.length);

        return {
            missingEntries: missingEntriesList,
            updatedEntries: updatedEntriesList,
            customEntries: customEntriesList,
            missingSections: missingSections ?? [],
            updatedSections: updatedSections ?? [],
            customSections: customSections ?? [],
            hasChanges
        };
    }

    _onRender(context: any, options: any): void | Promise<void> {
        (super._onRender as any)?.(context, options);
        const cancelBtn = this.element?.querySelector('button[name="cancel"]');
        cancelBtn?.addEventListener('click', async (event: any) => {
            event.preventDefault();
            const rawVersion = game.modules?.get(MODULE_ID)?.version ?? "1.0.0";
            if (rawVersion !== "#{VERSION}#" && game.settings) {
                await game.settings.set(MODULE_ID, "autorecVersion", rawVersion);
            }
            this.close();
        });
    }

    static async _formHandler(this: any, event: any, form: any, formData: any) {
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

        const aaManager = (globalThis as any).AutomatedAnimations?.AutorecManager;
        if (aaManager?.overwriteMenus) {
            await aaManager.overwriteMenus(JSON.stringify(newSettings), { submitAll: true });
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
