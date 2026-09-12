import { MODULE_ID } from "../../lib/constants.js";

import { adapter } from '../../adapters/index.js';

export interface RecommendedModuleConfig {
    id: string;
    name: string;
    description: string;
    icon?: string;
    altIds?: string[];
    isNative?: boolean;
    note?: string;
    patreon?: string;
    patreonIds?: string[];
}

export interface ProcessedRecommendedModule extends RecommendedModuleConfig {
    statusKey: string;
    statusLabel: string;
    statusClass: string;
    statusIcon: string;
    isActive: boolean;
    isPatreonInstalled: boolean;
    patreonClass: string;
}

export interface RecommendedSubcategoryConfig {
    id: string;
    name: string;
    icon: string;
    requireOne?: boolean;
    modules: RecommendedModuleConfig[];
}

export interface RecommendedCategoryConfig {
    id: string;
    name: string;
    icon: string;
    subcategories?: RecommendedSubcategoryConfig[];
    modules?: RecommendedModuleConfig[];
}

export const RECOMMENDED_CATEGORIES: RecommendedCategoryConfig[] = [
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
                        icon: "fa-solid fa-wand-magic-sparkles",
                        patreon: "https://www.patreon.com/c/EskieEffects"
                    },
                    {
                        id: "jb2a_patreon",
                        name: "EMP.recommendedModules.modules.jb2a.name",
                        altIds: ["JB2A_DnD5e"],
                        description: "EMP.recommendedModules.modules.jb2a.description",
                        icon: "fa-solid fa-film",
                        patreon: "https://www.patreon.com/c/JB2A"
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
                        icon: "fa-solid fa-gem",
                        patreon: "https://www.patreon.com/c/BossLoot"
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
                        icon: "fa-solid fa-music",
                        patreon: "https://www.patreon.com/c/PeriSFX"
                    }
                ]
            }
        ]
    },
    {
        id: "eventTriggering",
        name: "EMP.recommendedModules.categories.eventTriggering",
        icon: "fa-solid fa-bolt-lightning",
        subcategories: [
            {
                id: "regionTriggers",
                name: "EMP.recommendedModules.subcategories.regionTriggers",
                icon: "fa-solid fa-draw-polygon",
                modules: [
                    {
                        id: "foundry-regions",
                        isNative: true,
                        name: "EMP.recommendedModules.modules.foundryRegions.name",
                        description: "EMP.recommendedModules.modules.foundryRegions.description",
                        icon: "fa-solid fa-draw-polygon"
                    }
                ]
            },
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
                id: "tagging",
                name: "EMP.recommendedModules.subcategories.tagging",
                icon: "fa-solid fa-tags",
                modules: [
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
            },
            {
                id: "summoning",
                name: "EMP.recommendedModules.subcategories.summoning",
                icon: "fa-solid fa-hat-wizard",
                modules: [
                    {
                        id: "foundry-summons",
                        name: "EMP.recommendedModules.modules.foundrySummons.name",
                        description: "EMP.recommendedModules.modules.foundrySummons.description",
                        icon: "fa-solid fa-hat-wizard"
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
                patreonIds: ["boss-loot-assets-premium", "blfx-animation-editor-premium"],
                description: "EMP.recommendedModules.modules.bossLootFx.description",
                icon: "fa-solid fa-dragon",
                patreon: "https://www.patreon.com/c/BossLoot"
            }
        ]
    }
];

export function processModule(mod: RecommendedModuleConfig): ProcessedRecommendedModule {
    const patreonIds = mod.patreonIds ?? [mod.id];
    const isPatreonInstalled = Boolean(
        mod.patreon && patreonIds.some(id => Boolean(game.modules?.get(id)))
    );
    const patreonClass = isPatreonInstalled ? "installed" : "warning";

    if (mod.isNative) {
        const isSupported = Boolean(adapter.supportsRegionBehaviors);
        return {
            ...mod,
            name: game.i18n?.localize(mod.name) ?? mod.name,
            description: game.i18n?.localize(mod.description) ?? mod.description,
            note: mod.note ? (game.i18n?.localize(mod.note) ?? mod.note) : undefined,
            statusKey: "native",
            statusLabel: isSupported
                ? (game.i18n?.localize("EMP.recommendedModules.status.nativeSupported") ?? "Native Support")
                : (game.i18n?.localize("EMP.recommendedModules.status.nativeV14") ?? "Requires Foundry v14+"),
            statusClass: isSupported ? "native" : "disabled",
            statusIcon: isSupported ? "fa-solid fa-circle-check" : "fa-solid fa-circle-info",
            isActive: isSupported,
            isPatreonInstalled,
            patreonClass
        };
    }

    const primaryMod = game.modules?.get(mod.id);
    let isInstalled = false;
    let isActive = false;

    if (primaryMod) {
        isInstalled = true;
        if (primaryMod.active) {
            isActive = true;
        }
    }

    if (!isActive && mod.altIds) {
        for (const altId of mod.altIds) {
            const altMod = game.modules?.get(altId);
            if (altMod) {
                isInstalled = true;
                if (altMod.active) {
                    isActive = true;
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
        note: mod.note ? (game.i18n?.localize(mod.note) ?? mod.note) : undefined,
        statusKey,
        statusLabel,
        statusClass,
        statusIcon,
        isActive,
        isPatreonInstalled,
        patreonClass
    };
}

export class RecommendedModulesApp extends (adapter.foundry.HandlebarsApplicationMixin(adapter.foundry.ApplicationV2) as any) {
    static DEFAULT_OPTIONS = {
        id: "eskie-recommended-modules-menu",
        classes: ["eskie-world-scripts-form", "eskie-recommended-modules-form"],
        tag: "form",
        window: {
            title: "EMP.recommendedModules.menuTitle"
        },
        position: {
            width: 600,
            height: "auto"
        },
        form: {
            handler: RecommendedModulesApp._formHandler,
            closeOnSubmit: true
        },
        actions: {
            close: RecommendedModulesApp._onClose
        }
    };

    static get PARTS() {
        return {
            form: {
                template: `modules/${MODULE_ID}/src/ui/recommended-modules/recommendedModulesMenu.html`
            }
        };
    }

    _onRender(context: any, options: any) {
        (super._onRender as any)?.(context, options);

        const closeBtn = this.element?.querySelector?.('button[data-action="close"], button[name="submit"], .eskie-world-scripts-footer button');
        closeBtn?.addEventListener?.("click", (event: any) => {
            event?.preventDefault?.();
            this.close?.();
        });

        const patreonPills = this.element?.querySelectorAll?.('.eskie-patreon-pill');
        patreonPills?.forEach?.((pill: any) => {
            pill?.addEventListener?.("click", (event: any) => {
                event?.preventDefault?.();
                event?.stopPropagation?.();
                const href = pill.getAttribute?.("href");
                if (!href) return;
                if ((window as any)?.electron?.shell?.openExternal) {
                    (window as any).electron.shell.openExternal(href);
                } else {
                    window?.open?.(href, "_blank", "noopener,noreferrer");
                }
            });
        });
    }

    static async _onClose(this: any, event: any, target: any) {
        return this.close?.();
    }

    static async _formHandler(this: any, event: any, form: any, formData: any) {
        return this.close?.();
    }

    async _prepareContext(options: any): Promise<any> {
        const categories = RECOMMENDED_CATEGORIES.map(cat => {
            const catData: Record<string, any> = {
                id: cat.id,
                name: game.i18n?.localize(cat.name) ?? cat.name,
                icon: cat.icon
            };

            if (cat.subcategories) {
                catData.subcategories = cat.subcategories.map(sub => {
                    const processedModules = sub.modules.map(processModule);
                    let subStatus: Record<string, any> | null = null;

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
