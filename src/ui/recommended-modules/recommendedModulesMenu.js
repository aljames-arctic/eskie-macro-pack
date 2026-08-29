import { MODULE_ID } from "../../lib/constants.js";

import { adapter } from '../../adapters/index.js';

export const RECOMMENDED_CATEGORIES = [
    {
        id: "assets",
        name: "EMP.recommendedModules.categories.assets",
        icon: "fa-solid fa-gem",
        subcategories: [
            {
                id: "visual",
                name: "EMP.recommendedModules.subcategories.visual",
                icon: "fa-solid fa-wand-magic-sparkles",
                modules: [
                    {
                        id: "eskie-effects",
                        name: "EMP.recommendedModules.modules.eskieEffects.name",
                        altIds: ["eskie-effects-free"],
                        description: "EMP.recommendedModules.modules.eskieEffects.description",
                        icon: "fa-solid fa-wand-magic-sparkles"
                    },
                    {
                        id: "jb2a_patreon",
                        name: "EMP.recommendedModules.modules.jb2a.name",
                        altIds: ["JB2A_DnD5e"],
                        description: "EMP.recommendedModules.modules.jb2a.description",
                        icon: "fa-solid fa-film"
                    },
                    {
                        id: "jaamod",
                        name: "EMP.recommendedModules.modules.jaamod.name",
                        description: "EMP.recommendedModules.modules.jaamod.description",
                        icon: "fa-solid fa-palette"
                    },
                    {
                        id: "boss-loot-assets-premium",
                        name: "EMP.recommendedModules.modules.bossLoot.name",
                        altIds: ["boss-loot-assets-free", "blfx-assets-pack01"],
                        description: "EMP.recommendedModules.modules.bossLoot.description",
                        icon: "fa-solid fa-gem"
                    }
                ]
            },
            {
                id: "sound",
                name: "EMP.recommendedModules.subcategories.sound",
                icon: "fa-solid fa-volume-high",
                modules: [
                    {
                        id: "psfx-patreon",
                        name: "EMP.recommendedModules.modules.psfx.name",
                        altIds: ["psfx"],
                        description: "EMP.recommendedModules.modules.psfx.description",
                        icon: "fa-solid fa-music"
                    }
                ]
            }
        ]
    },
    {
        id: "functionality",
        name: "EMP.recommendedModules.categories.functionality",
        icon: "fa-solid fa-sliders",
        subcategories: [
            {
                id: "tileTriggers",
                name: "EMP.recommendedModules.subcategories.tileTriggers",
                icon: "fa-solid fa-vector-square",
                modules: [
                    {
                        id: "monks-active-tiles",
                        name: "EMP.recommendedModules.modules.matt.name",
                        description: "EMP.recommendedModules.modules.matt.description",
                        icon: "fa-solid fa-vector-square"
                    },
                    {
                        id: "tagger",
                        name: "EMP.recommendedModules.modules.tagger.name",
                        description: "EMP.recommendedModules.modules.tagger.description",
                        icon: "fa-solid fa-tags"
                    }
                ]
            },
            {
                id: "objectAttaching",
                name: "EMP.recommendedModules.subcategories.objectAttaching",
                icon: "fa-solid fa-link",
                requireOne: true,
                modules: [
                    {
                        id: "token-attacher",
                        name: "EMP.recommendedModules.modules.tokenAttacher.name",
                        description: "EMP.recommendedModules.modules.tokenAttacher.description",
                        icon: "fa-solid fa-link"
                    },
                    {
                        id: "multi-token-edit",
                        name: "EMP.recommendedModules.modules.massEdit.name",
                        description: "EMP.recommendedModules.modules.massEdit.description",
                        icon: "fa-solid fa-layer-group"
                    }
                ]
            }
        ]
    },
    {
        id: "automation",
        name: "EMP.recommendedModules.categories.automation",
        icon: "fa-solid fa-bolt",
        modules: [
            {
                id: "autoanimations",
                name: "EMP.recommendedModules.modules.autoanimations.name",
                description: "EMP.recommendedModules.modules.autoanimations.description",
                icon: "fa-solid fa-bolt"
            },
            {
                id: "boss-loot-assets-premium",
                name: "EMP.recommendedModules.modules.bossLootFx.name",
                altIds: ["blfx-animation-editor-premium", "blfx"],
                description: "EMP.recommendedModules.modules.bossLootFx.description",
                icon: "fa-solid fa-dragon"
            }
        ]
    }
];

function processModule(mod) {
    const primaryMod = game.modules?.get(mod.id);
    let activeMod = null;
    let isInstalled = false;
    let isActive = false;

    if (primaryMod) {
        isInstalled = true;
        if (primaryMod.active) {
            isActive = true;
            activeMod = primaryMod;
        }
    }

    if (!isActive && mod.altIds) {
        for (const altId of mod.altIds) {
            const altMod = game.modules?.get(altId);
            if (altMod) {
                isInstalled = true;
                if (altMod.active) {
                    isActive = true;
                    activeMod = altMod;
                    break;
                }
            }
        }
    }

    let statusKey = "missing";
    let statusLabel = game.i18n?.localize("EMP.recommendedModules.status.missing") ?? "Missing";
    let statusClass = "missing";
    let statusIcon = "fa-solid fa-circle-xmark";

    if (isActive) {
        statusKey = "active";
        statusClass = "active";
        statusIcon = "fa-solid fa-check-circle";
        statusLabel = game.i18n?.localize("EMP.recommendedModules.status.active") ?? "Active";
    } else if (isInstalled) {
        statusKey = "disabled";
        statusClass = "disabled";
        statusIcon = "fa-solid fa-pause-circle";
        statusLabel = game.i18n?.localize("EMP.recommendedModules.status.disabled") ?? "Disabled";
    }

    return {
        ...mod,
        name: game.i18n?.localize(mod.name) ?? mod.name,
        description: game.i18n?.localize(mod.description) ?? mod.description,
        note: mod.note ? (game.i18n?.localize(mod.note) ?? mod.note) : null,
        statusKey,
        statusLabel,
        statusClass,
        statusIcon,
        isActive
    };
}

export class RecommendedModulesApp extends adapter.foundry.HandlebarsApplicationMixin(adapter.foundry.ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "eskie-recommended-modules-menu",
        classes: ["eskie-world-scripts-form", "eskie-recommended-modules-form"],
        tag: "div",
        window: {
            title: "EMP.recommendedModules.menuTitle"
        },
        position: {
            width: 600,
            height: "auto"
        },
        form: {
            closeOnSubmit: true
        }
    };

    static get PARTS() {
        return {
            form: {
                template: `modules/${MODULE_ID}/src/ui/recommended-modules/recommendedModulesMenu.html`
            }
        };
    }

    async _prepareContext(options) {
        const categories = RECOMMENDED_CATEGORIES.map(cat => {
            const catData = {
                id: cat.id,
                name: game.i18n?.localize(cat.name) ?? cat.name,
                icon: cat.icon
            };

            if (cat.subcategories) {
                catData.subcategories = cat.subcategories.map(sub => {
                    const processedModules = sub.modules.map(processModule);
                    let subStatus = null;

                    if (sub.requireOne) {
                        const hasActive = processedModules.some(m => m.isActive);
                        subStatus = {
                            isSupported: hasActive,
                            statusClass: hasActive ? "active" : "warning",
                            statusIcon: hasActive ? "fa-solid fa-check-circle" : "fa-solid fa-circle-info",
                            statusLabel: hasActive
                                ? (game.i18n?.localize("EMP.recommendedModules.status.supported") ?? "Supported")
                                : (game.i18n?.localize("EMP.recommendedModules.status.requireOne") ?? "At least one recommended")
                        };
                    }

                    return {
                        id: sub.id,
                        name: game.i18n?.localize(sub.name) ?? sub.name,
                        icon: sub.icon,
                        subStatus,
                        modules: processedModules
                    };
                });
            } else if (cat.modules) {
                catData.modules = cat.modules.map(processModule);
            }

            return catData;
        });

        return {
            categories,
            menuHint: game.i18n?.localize("EMP.recommendedModules.menuHint") ?? ""
        };
    }
}

export { RecommendedModulesApp as RecommendedModulesFormApplication };
