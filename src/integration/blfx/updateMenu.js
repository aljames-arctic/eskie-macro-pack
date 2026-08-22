import { MODULE_ID } from "../../lib/constants.js";
import { EMP_BLFX_Registry } from "../blfx.js";
import { log } from '../../lib/logger.js';

/**
 * Extracts a semver version string from an EMP note field, e.g. "Eskie Macro Pack (1.0.0)".
 * @param {string} note The note text
 * @returns {string} The version string or "0.0.0"
 */
function extractVersionFromNote(note) {
    const match = (note ?? '').match(/Eskie Macro Pack \(([^)]+)\)/);
    return match ? match[1] : "0.0.0";
}

/**
 * Generates a comparison between incoming EMP BLFX registry entries and existing BLFX world settings.
 * @param {object} [empRegistry=EMP_BLFX_Registry] The BLFX registry entries to compare
 * @param {Set<string>} [excludedKeys=new Set()] Set of entry keys to exclude from addition
 * @returns {Promise<object>} Comparison results and formatted resource payload
 */
export async function generateBlfxAutorecUpdate(empRegistry = EMP_BLFX_Registry, excludedKeys = new Set()) {
    log.group("Boss Loot FX Autorec Check", 'debug');

    let existingData = {};
    try {
        if (game.settings?.settings?.has('boss-loot-assets-premium.blfxCustomAutoRecognition')) {
            existingData = game.settings.get('boss-loot-assets-premium', 'blfxCustomAutoRecognition') ?? {};
        }
    } catch (err) {
        log.debug("EMP | Could not read existing blfxCustomAutoRecognition setting:", err);
    }

    let existingTree = {};
    if (existingData?.customAutoRecognition && typeof existingData.customAutoRecognition === 'object') {
        existingTree = foundry.utils.duplicate(existingData.customAutoRecognition);
    } else if (existingData?.flags?.['boss-loot-assets-premium']?.customAutoRecognition && typeof existingData.flags['boss-loot-assets-premium'].customAutoRecognition === 'object') {
        existingTree = foundry.utils.duplicate(existingData.flags['boss-loot-assets-premium'].customAutoRecognition);
    } else if (existingData && typeof existingData === 'object' && !existingData.flags) {
        existingTree = foundry.utils.duplicate(existingData);
    }

    const missingEntries = [];
    const updatedEntries = [];
    const customEntries = [];
    const sameEntries = [];

    // 1st Pass: Compare incoming EMP entries against existing BLFX settings
    for (const [systemId, items] of Object.entries(empRegistry)) {
        for (const [itemSlug, activities] of Object.entries(items)) {
            for (const [activitySlug, triggers] of Object.entries(activities)) {
                for (const [triggerMode, newEntry] of Object.entries(triggers)) {
                    const entryKey = `${systemId}___${itemSlug}___${activitySlug}___${triggerMode}`;
                    const formatted = {
                        key: entryKey,
                        systemId,
                        itemSlug,
                        activitySlug,
                        triggerMode,
                        label: newEntry.animationName || newEntry.itemName || itemSlug,
                        menu: `${newEntry.activityName || activitySlug} (${newEntry.triggerName || triggerMode})`,
                        entry: newEntry
                    };

                    const existingEntry = existingTree?.[systemId]?.[itemSlug]?.[activitySlug]?.[triggerMode];

                    if (!existingEntry) {
                        missingEntries.push(formatted);
                    } else if (existingEntry.note?.includes?.("Eskie Macro Pack")) {
                        const newVersion = extractVersionFromNote(newEntry.note);
                        const oldVersion = extractVersionFromNote(existingEntry.note);
                        if (foundry.utils.isNewerVersion(newVersion, oldVersion)) {
                            updatedEntries.push(formatted);
                        } else {
                            sameEntries.push(formatted);
                        }
                    } else {
                        customEntries.push(formatted);
                    }
                }
            }
        }
    }

    log.debug("BLFX Missing entries (to add):", missingEntries);
    log.debug("BLFX Updated entries:", updatedEntries);
    log.debug("BLFX Same entries (up to date):", sameEntries);
    log.debug("BLFX Conflicting custom entries (ignored/preserved):", customEntries);
    log.groupEnd();

    // 2nd Pass: Build the merged tree, filtering out excluded missing entries
    const mergedTree = foundry.utils.duplicate(existingTree);

    // Add selected missing entries
    for (const item of missingEntries) {
        if (excludedKeys.has(item.key)) continue;
        if (!mergedTree[item.systemId]) mergedTree[item.systemId] = {};
        if (!mergedTree[item.systemId][item.itemSlug]) mergedTree[item.systemId][item.itemSlug] = {};
        if (!mergedTree[item.systemId][item.itemSlug][item.activitySlug]) mergedTree[item.systemId][item.itemSlug][item.activitySlug] = {};
        mergedTree[item.systemId][item.itemSlug][item.activitySlug][item.triggerMode] = item.entry;
    }

    // Apply updated entries
    for (const item of updatedEntries) {
        if (!mergedTree[item.systemId]) mergedTree[item.systemId] = {};
        if (!mergedTree[item.systemId][item.itemSlug]) mergedTree[item.systemId][item.itemSlug] = {};
        if (!mergedTree[item.systemId][item.itemSlug][item.activitySlug]) mergedTree[item.systemId][item.itemSlug][item.activitySlug] = {};
        mergedTree[item.systemId][item.itemSlug][item.activitySlug][item.triggerMode] = item.entry;
    }

    const newPayload = {
        flags: {
            "boss-loot-assets-premium": {
                customAutoRecognition: true
            }
        },
        customAutoRecognition: mergedTree
    };

    return {
        newPayload,
        missingEntries: missingEntries.sort((a, b) => a.label.localeCompare(b.label)),
        updatedEntries: updatedEntries.sort((a, b) => a.label.localeCompare(b.label)),
        customEntries: customEntries.sort((a, b) => a.label.localeCompare(b.label)),
        sameEntries
    };
}

/**
 * Interactive FormApplication for reviewing and synchronizing Boss Loot FX custom auto-recognition presets.
 */
export class BlfxAutorecUpdateFormApplication extends FormApplication {
    constructor(registry = EMP_BLFX_Registry) {
        super();
        this.registry = registry;
    }

    async settings(excludedKeys = new Set()) {
        return await generateBlfxAutorecUpdate(this.registry, excludedKeys);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["eskie-world-scripts-form", "eskie-aa-update-form"],
            popOut: true,
            template: `modules/${MODULE_ID}/src/integration/blfx/autorecUpdateMenu.html`,
            id: "empBlfxAutorecUpdateMenu",
            title: "EMP.blfxUpdateMenu.menuTitle",
            width: 640,
            height: "auto",
            closeOnSubmit: true
        });
    }

    async getData() {
        const {
            missingEntries,
            updatedEntries,
            customEntries,
        } = await this.settings();

        const hasChanges = Boolean(missingEntries.length || updatedEntries.length || customEntries.length);

        return {
            missingEntries,
            updatedEntries,
            customEntries,
            hasChanges
        };
    }

    async activateListeners(html) {
        const {
            missingEntries,
            updatedEntries,
            customEntries,
        } = await this.settings();

        if (!missingEntries.length && !updatedEntries.length && !customEntries.length) {
            html.find('[name="update"]').remove();
        }
        super.activateListeners(html);

        html.find('button[name="cancel"]').on('click', () => this.close());
    }

    async _updateObject(event, formData) {
        $(".emp-animations-autorec-update-footer button").attr("disabled", true);
        if (event.submitter && event.submitter.name === "update") {
            log.group("Boss Loot FX Autorec Menu Update");

            const excludedKeys = new Set();
            if (formData) {
                for (const [key, value] of Object.entries(formData)) {
                    if (key.startsWith("missing_") && !value) {
                        const entryKey = key.replace("missing_", "");
                        excludedKeys.add(entryKey);
                    }
                }
            }

            const { newPayload } = await this.settings(excludedKeys);
            if (!newPayload?.customAutoRecognition || Object.keys(newPayload.customAutoRecognition).length === 0) {
                log.debug("EMP | Nothing to update in Boss Loot FX!");
                log.groupEnd();
                return;
            }

            const rawVersion = game.modules?.get(MODULE_ID)?.version ?? "1.0.0";
            const isDevelopment = rawVersion === "#{VERSION}#";
            const effectiveVersion = isDevelopment ? this._getDevelopmentVersion() : rawVersion;

            Hooks.call('blfx.register.CustomAutoRec', newPayload, MODULE_ID, effectiveVersion);

            if (game.settings) {
                await game.settings.set(MODULE_ID, "blfxAutorecVersion", effectiveVersion);
            }

            log.info("EMP | Custom animations have been updated in Boss Loot FX.");
            log.groupEnd();
        }
    }

    _getDevelopmentVersion() {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        return `${yy}.${mm}.${dd}.${hh}.${min}.${ss}`;
    }
}
