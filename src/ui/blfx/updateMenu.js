import { MODULE_ID } from "../../lib/constants.js";
import { EMP_BLFX_Registry } from "../../adapters/modules/blfx/blfx.js";
import { log } from '../../lib/logger.js';
import { BaseFoundryAdapter } from '../../adapters/foundry/index.js';

const foundryPlatform = new BaseFoundryAdapter();

/**
 * Known Boss Loot FX module IDs and setting keys across premium, free, and core packages.
 */
const BLFX_MODULES = ['boss-loot-assets-premium', 'boss-loot-assets-free', 'blfx', 'blfx-assets-pack01'];
const BLFX_SETTING_KEYS = ['blfxCustomAutoRecognition', 'customAutoRecognition'];

/**
 * Safely retrieves existing Custom Auto-Recognition data from any registered BLFX module settings.
 * @returns {object} Existing BLFX customAutoRecognition object
 */
export function readExistingBlfxData() {
    for (const mod of BLFX_MODULES) {
        for (const key of BLFX_SETTING_KEYS) {
            const settingKey = `${mod}.${key}`;
            try {
                if (game.settings?.settings?.has?.(settingKey)) {
                    let val = game.settings.get(mod, key);
                    if (typeof val === 'string') {
                        try { val = JSON.parse(val); } catch {}
                    }
                    if (val && typeof val === 'object') {
                        return val;
                    }
                }
            } catch (err) {
                log.debug(`EMP | Could not read ${settingKey}:`, err);
            }
        }
    }
    return {};
}

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
 * Groups BLFX entries by trigger category in a preferred order.
 * @param {Array<object>} entries Formatted entries list
 * @returns {Array<{triggerName: string, triggerMode: string, entries: Array<object>}>}
 */
export function groupBlfxEntriesByTrigger(entries = []) {
    const preferredSectionOrder = [
        "After Activity Use (Default)",
        "After Attack Roll",
        "After Damage Roll",
        "After Active Effects",
        "After Summon",
        "After Template Create"
    ];

    const preferredSubOrder = [
        "Melee",
        "Ranged",
        "On Token"
    ];

    const sections = {};

    for (const item of entries) {
        const triggerMode = item.triggerMode ?? item.entry?.animationData?.eventType ?? '';
        const rawTriggerName = item.triggerName ?? item.triggerMode ?? '';
        const macroType = item.macroType ?? item.entry?.animationData?.macroType ?? '';
        const itemName = item.itemName ?? item.label ?? '';

        let mainSection = "After Activity Use (Default)";
        let subSection = item.subTriggerName ?? "";

        if (triggerMode === 'afterAttack' || rawTriggerName.includes('After Attack Roll') || rawTriggerName.includes('afterAttack')) {
            mainSection = "After Attack Roll";
            if (!subSection) {
                if (macroType.includes('Melee') || itemName.startsWith('(Melee)') || rawTriggerName.includes('Melee')) {
                    subSection = "Melee";
                } else if (macroType.includes('Ranged') || itemName.startsWith('(Ranged)') || rawTriggerName.includes('Ranged')) {
                    subSection = "Ranged";
                } else {
                    subSection = "On Token";
                }
            }
        } else if (triggerMode === 'afterDamage' || rawTriggerName.includes('After Damage Roll') || rawTriggerName.includes('afterDamage')) {
            mainSection = "After Damage Roll";
            if (!subSection) {
                if (macroType.includes('Melee') || itemName.startsWith('(Melee)') || rawTriggerName.includes('Melee')) {
                    subSection = "Melee";
                } else if (macroType.includes('Ranged') || itemName.startsWith('(Ranged)') || rawTriggerName.includes('Ranged')) {
                    subSection = "Ranged";
                } else {
                    subSection = "On Token";
                }
            }
        } else if (triggerMode === 'afterActiveEffects' || rawTriggerName.includes('Active Effect')) {
            mainSection = "After Active Effects";
        } else if (triggerMode === 'afterSummon' || rawTriggerName.includes('Summon')) {
            mainSection = "After Summon";
        } else if (triggerMode === 'createTemplate' || rawTriggerName.includes('Template')) {
            mainSection = "After Template Create";
        } else if (rawTriggerName) {
            mainSection = rawTriggerName;
        }

        if (!sections[mainSection]) {
            sections[mainSection] = {
                triggerName: mainSection,
                triggerMode: triggerMode,
                subsectionsMap: {}
            };
        }

        if (!sections[mainSection].subsectionsMap[subSection]) {
            sections[mainSection].subsectionsMap[subSection] = [];
        }

        sections[mainSection].subsectionsMap[subSection].push(item);
    }

    const result = [];
    for (const [secName, secData] of Object.entries(sections)) {
        const sortedSubsections = [];
        for (const [subName, subEntries] of Object.entries(secData.subsectionsMap)) {
            subEntries.sort((a, b) => (a.itemName ?? a.label ?? "").localeCompare(b.itemName ?? b.label ?? ""));
            sortedSubsections.push({
                subTriggerName: subName,
                hasSubTriggerName: Boolean(subName),
                entries: subEntries
            });
        }

        sortedSubsections.sort((a, b) => {
            const idxA = preferredSubOrder.indexOf(a.subTriggerName);
            const idxB = preferredSubOrder.indexOf(b.subTriggerName);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return (a.subTriggerName ?? "").localeCompare(b.subTriggerName ?? "");
        });

        const flatEntries = sortedSubsections.flatMap(s => s.entries);

        result.push({
            triggerName: secName,
            triggerMode: secData.triggerMode,
            hasSubsections: sortedSubsections.some(s => Boolean(s.subTriggerName)),
            subsections: sortedSubsections,
            entries: flatEntries
        });
    }

    return result.sort((a, b) => {
        const idxA = preferredSectionOrder.indexOf(a.triggerName);
        const idxB = preferredSectionOrder.indexOf(b.triggerName);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.triggerName.localeCompare(b.triggerName);
    });
}

/**
 * Generates a comparison between incoming EMP BLFX registry entries and existing BLFX world settings.
 * @param {object} [empRegistry=EMP_BLFX_Registry] The BLFX registry entries to compare
 * @param {Set<string>} [excludedKeys=new Set()] Set of entry keys to exclude from addition
 * @returns {Promise<object>} Comparison results and formatted resource payload
 */
export async function generateBlfxAutorecUpdate(empRegistry = EMP_BLFX_Registry, excludedKeys = new Set()) {
    log.group("Boss Loot FX Autorec Check", 'debug');

    const existingData = readExistingBlfxData();

    let existingTree = {};
    if (existingData?.customAutoRecognition && typeof existingData.customAutoRecognition === 'object' && !Array.isArray(existingData.customAutoRecognition)) {
        existingTree = foundry.utils.duplicate(existingData.customAutoRecognition);
    } else if (existingData?.flags?.['boss-loot-assets-premium']?.customAutoRecognition && typeof existingData.flags['boss-loot-assets-premium'].customAutoRecognition === 'object') {
        existingTree = foundry.utils.duplicate(existingData.flags['boss-loot-assets-premium'].customAutoRecognition);
    } else if (existingData && typeof existingData === 'object' && !Array.isArray(existingData) && !existingData.flags) {
        existingTree = foundry.utils.duplicate(existingData);
    }
    if (typeof existingTree !== 'object' || existingTree === null || Array.isArray(existingTree)) {
        existingTree = {};
    }

    const missingEntries = [];
    const updatedEntries = [];
    const customEntries = [];
    const sameEntries = [];

    // 1st Pass: Compare incoming EMP entries against existing BLFX settings
    for (const [systemId, items] of Object.entries(empRegistry ?? {})) {
        if (!items || typeof items !== 'object') continue;
        for (const [itemSlug, activities] of Object.entries(items)) {
            if (!activities || typeof activities !== 'object') continue;
            for (const [activitySlug, triggers] of Object.entries(activities)) {
                if (!triggers || typeof triggers !== 'object') continue;
                for (const [triggerMode, newEntry] of Object.entries(triggers)) {
                    if (!newEntry || typeof newEntry !== 'object') continue;

                    const entryKey = `${systemId}___${itemSlug}___${activitySlug}___${triggerMode}`;
                    const itemName = newEntry.itemName ?? itemSlug;
                    const effectName = newEntry.animationName ?? itemName;
                    const activityName = newEntry.activityName ?? activitySlug;
                    const triggerName = newEntry.triggerName ?? triggerMode;
                    const subtext = (newEntry.animationName && newEntry.animationName !== itemName)
                        ? newEntry.animationName
                        : (activityName && activityName !== 'Default' ? activityName : '');

                    const formatted = {
                        key: entryKey,
                        systemId,
                        itemSlug,
                        activitySlug,
                        triggerMode,
                        itemName,
                        effectName,
                        activityName,
                        triggerName,
                        subtext,
                        label: itemName,
                        menu: triggerName,
                        macroType: newEntry.animationData?.macroType ?? '',
                        entry: newEntry
                    };

                    const existingEntry = existingTree?.[systemId]?.[itemSlug]?.[activitySlug]?.[triggerMode];

                    if (!existingEntry || typeof existingEntry !== 'object') {
                        missingEntries.push(formatted);
                    } else if (typeof existingEntry.note === 'string' && existingEntry.note.includes("Eskie Macro Pack")) {
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
        if (!mergedTree[item.systemId] || typeof mergedTree[item.systemId] !== 'object') mergedTree[item.systemId] = {};
        if (!mergedTree[item.systemId][item.itemSlug] || typeof mergedTree[item.systemId][item.itemSlug] !== 'object') mergedTree[item.systemId][item.itemSlug] = {};
        if (!mergedTree[item.systemId][item.itemSlug][item.activitySlug] || typeof mergedTree[item.systemId][item.itemSlug][item.activitySlug] !== 'object') mergedTree[item.systemId][item.itemSlug][item.activitySlug] = {};
        mergedTree[item.systemId][item.itemSlug][item.activitySlug][item.triggerMode] = item.entry;
    }

    // Apply updated entries
    for (const item of updatedEntries) {
        if (!mergedTree[item.systemId] || typeof mergedTree[item.systemId] !== 'object') mergedTree[item.systemId] = {};
        if (!mergedTree[item.systemId][item.itemSlug] || typeof mergedTree[item.systemId][item.itemSlug] !== 'object') mergedTree[item.systemId][item.itemSlug] = {};
        if (!mergedTree[item.systemId][item.itemSlug][item.activitySlug] || typeof mergedTree[item.systemId][item.itemSlug][item.activitySlug] !== 'object') mergedTree[item.systemId][item.itemSlug][item.activitySlug] = {};
        mergedTree[item.systemId][item.itemSlug][item.activitySlug][item.triggerMode] = item.entry;
    }

    const newPayload = {
        flags: {
            "boss-loot-assets-premium": {
                customAutoRecognition: true
            },
            "boss-loot-assets-free": {
                customAutoRecognition: true
            },
            "blfx": {
                customAutoRecognition: true
            }
        },
        customAutoRecognition: mergedTree
    };

    return {
        newPayload,
        missingEntries: missingEntries.sort((a, b) => (a.label ?? "").localeCompare(b.label ?? "")),
        updatedEntries: updatedEntries.sort((a, b) => (a.label ?? "").localeCompare(b.label ?? "")),
        customEntries: customEntries.sort((a, b) => (a.label ?? "").localeCompare(b.label ?? "")),
        sameEntries
    };
}

/**
 * Interactive ApplicationV2 for reviewing and synchronizing Boss Loot FX custom auto-recognition presets.
 */
export class BlfxAutorecUpdateApp extends foundryPlatform.HandlebarsApplicationMixin(foundryPlatform.ApplicationV2) {
    constructor(registry = EMP_BLFX_Registry, options = {}) {
        super(options);
        this.registry = registry;
    }

    static DEFAULT_OPTIONS = {
        id: "empBlfxAutorecUpdateMenu",
        classes: ["eskie-world-scripts-form", "eskie-aa-update-form"],
        tag: "form",
        window: {
            title: "EMP.blfxUpdateMenu.menuTitle"
        },
        position: {
            width: 980,
            height: "auto"
        },
        form: {
            handler: BlfxAutorecUpdateApp._formHandler,
            closeOnSubmit: true
        }
    };

    static get PARTS() {
        return {
            form: {
                template: `modules/${MODULE_ID}/src/ui/blfx/autorecUpdateMenu.html`
            }
        };
    }

    async settings(excludedKeys = new Set()) {
        return await generateBlfxAutorecUpdate(this.registry, excludedKeys);
    }

    async _prepareContext(options) {
        const {
            missingEntries,
            updatedEntries,
            customEntries,
        } = await this.settings();

        const missingSections = groupBlfxEntriesByTrigger(missingEntries);
        const updatedSections = groupBlfxEntriesByTrigger(updatedEntries);
        const customSections = groupBlfxEntriesByTrigger(customEntries);

        const hasChanges = Boolean(missingEntries.length || updatedEntries.length || customEntries.length);

        return {
            missingEntries,
            updatedEntries,
            customEntries,
            missingSections,
            updatedSections,
            customSections,
            hasChanges
        };
    }

    _onRender(context, options) {
        super._onRender?.(context, options);
        const cancelBtn = this.element?.querySelector('button[name="cancel"]');
        cancelBtn?.addEventListener('click', (event) => {
            event.preventDefault();
            this.close();
        });
    }

    static async _formHandler(event, form, formData) {
        const isCancel = event.submitter && event.submitter.name === "cancel";
        if (isCancel) return;

        log.group("Boss Loot FX Autorec Menu Update");

        const excludedKeys = new Set();
        const checkboxes = form?.querySelectorAll ? form.querySelectorAll('input[type="checkbox"][name^="missing_"]') : [];
        if (checkboxes.length) {
            for (const cb of checkboxes) {
                if (!cb.checked) {
                    const entryKey = cb.name.replace("missing_", "");
                    excludedKeys.add(entryKey);
                }
            }
        } else {
            const rawData = formData.object ?? formData;
            if (rawData) {
                for (const [key, value] of Object.entries(rawData)) {
                    if (key.startsWith("missing_") && !value) {
                        const entryKey = key.replace("missing_", "");
                        excludedKeys.add(entryKey);
                    }
                }
            }
        }

        const appInstance = this;
        const { newPayload } = appInstance?.settings ? await appInstance.settings(excludedKeys) : await generateBlfxAutorecUpdate(EMP_BLFX_Registry, excludedKeys);

        if (!newPayload?.customAutoRecognition || Object.keys(newPayload.customAutoRecognition).length === 0) {
            log.debug("EMP | Nothing to update in Boss Loot FX!");
            log.groupEnd();
            return;
        }

        // 1. Directly write the merged customAutoRecognition payload to all active BLFX settings
        for (const mod of BLFX_MODULES) {
            for (const key of BLFX_SETTING_KEYS) {
                const settingKey = `${mod}.${key}`;
                try {
                    if (game.settings?.settings?.has?.(settingKey)) {
                        await game.settings.set(mod, key, newPayload);
                        log.info(`EMP | Directly saved custom auto-recognition payload to ${settingKey}`);
                    }
                } catch (err) {
                    log.debug(`EMP | Could not directly write to ${settingKey}:`, err);
                }
            }
        }

        // 2. Compute an effective version string that satisfies BLFX's isNewerVersion guard
        const rawVersion = game.modules?.get(MODULE_ID)?.version ?? "1.0.0";
        const effectiveVersion = rawVersion === "#{VERSION}#" 
            ? BlfxAutorecUpdateApp._getDevelopmentVersion() 
            : `${rawVersion}.${Date.now()}`;

        // 3. Dispatch the official BLFX registration Hook
        Hooks.callAll('blfx.register.CustomAutoRec', newPayload, MODULE_ID, effectiveVersion);

        // 4. Update EMP's internal tracking version
        if (game.settings?.settings?.has?.(`${MODULE_ID}.blfxAutorecVersion`)) {
            await game.settings.set(MODULE_ID, "blfxAutorecVersion", effectiveVersion);
        }

        log.info("EMP | Custom animations have been updated in Boss Loot FX.");
        log.groupEnd();
    }

    _getDevelopmentVersion() {
        return BlfxAutorecUpdateApp._getDevelopmentVersion();
    }

    static _getDevelopmentVersion() {
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

export { BlfxAutorecUpdateApp as BlfxAutorecUpdateFormApplication };
