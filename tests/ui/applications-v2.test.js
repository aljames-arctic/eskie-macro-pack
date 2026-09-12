import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BlfxAutorecUpdateApp, BlfxAutorecUpdateFormApplication } from '../../src/ui/blfx/updateMenu.js';
import { AutorecUpdateApp, autorecUpdateFormApplication } from '../../src/ui/autoanimations/updateMenu.js';
import { WorldScriptsApp, WorldScriptsFormApplication } from '../../src/ui/world-scripts/worldScriptsMenu.js';
import { RecommendedModulesApp, RecommendedModulesFormApplication, processModule } from '../../src/ui/recommended-modules/recommendedModulesMenu.js';
import { ConfigureAutorecApp, ConfigureAutorecFormApplication } from '../../src/ui/autorec/manageAutorecMenu.js';

test('BlfxAutorecUpdateApp inherits from ApplicationV2 with HandlebarsApplicationMixin', async () => {
    assert.equal(BlfxAutorecUpdateApp, BlfxAutorecUpdateFormApplication);
    const app = new BlfxAutorecUpdateApp({});
    assert.ok(app);
    assert.equal(BlfxAutorecUpdateApp.DEFAULT_OPTIONS.id, 'empBlfxAutorecUpdateMenu');
    assert.ok(BlfxAutorecUpdateApp.PARTS.form.template.includes('autorecUpdateMenu.html'));

    const rendered = await app.render(true);
    assert.equal(rendered.rendered, true);
    await app.close();
    assert.equal(app.rendered, false);
});

test('AutorecUpdateApp inherits from ApplicationV2 with HandlebarsApplicationMixin', async () => {
    assert.equal(AutorecUpdateApp, autorecUpdateFormApplication);
    const app = new AutorecUpdateApp({});
    assert.ok(app);
    assert.equal(AutorecUpdateApp.DEFAULT_OPTIONS.id, 'empAutorecUpdateMenu');
    assert.equal(AutorecUpdateApp.DEFAULT_OPTIONS.position.width, 980);

    const rendered = await app.render(true);
    assert.equal(rendered.rendered, true);
    await app.close();
});

test('groupAAEntriesBySection groups entries into 5-column compatible sections in preferred order', async () => {
    const { groupAAEntriesBySection } = await import('../../src/ui/autoanimations/updateMenu.js');
    const sections = groupAAEntriesBySection({
        templatefx: [{ id: 't1', label: 'Teleport', metaData: { version: '1.0.0' } }],
        melee: [{ id: 'm1', label: 'Dagger (Melee)', metaData: { version: '1.0.0' } }],
        aura: [{ id: 'a1', label: 'Twilight Sanctuary', metaData: { version: '1.0.0' } }]
    });

    assert.equal(sections.length, 3);
    assert.equal(sections[0].sectionId, 'melee');
    assert.equal(sections[0].sectionName, 'Melee Attacks');
    assert.equal(sections[1].sectionId, 'templatefx');
    assert.equal(sections[1].sectionName, 'Templates');
    assert.equal(sections[2].sectionId, 'aura');
    assert.equal(sections[2].sectionName, 'Auras');
    assert.equal(sections[1].entries[0].label, 'Teleport');
});

test('WorldScriptsApp inherits from ApplicationV2 with HandlebarsApplicationMixin', async () => {
    assert.equal(WorldScriptsApp, WorldScriptsFormApplication);
    const app = new WorldScriptsApp();
    assert.ok(app);
    assert.equal(WorldScriptsApp.DEFAULT_OPTIONS.id, 'eskie-world-scripts-menu');

    const context = await app._prepareContext();
    assert.ok(Array.isArray(context.scripts));
    assert.ok(context.scripts.some(s => s.id === 'rollAnimation'));
});

test('RecommendedModulesApp inherits from ApplicationV2 with HandlebarsApplicationMixin and supports close button functionality', async () => {
    assert.equal(RecommendedModulesApp, RecommendedModulesFormApplication);
    const app = new RecommendedModulesApp();
    assert.ok(app);
    assert.equal(RecommendedModulesApp.DEFAULT_OPTIONS.id, 'eskie-recommended-modules-menu');
    assert.equal(RecommendedModulesApp.DEFAULT_OPTIONS.tag, 'form');
    assert.equal(RecommendedModulesApp.DEFAULT_OPTIONS.form.closeOnSubmit, true);
    assert.equal(RecommendedModulesApp.DEFAULT_OPTIONS.form.handler, RecommendedModulesApp._formHandler);
    assert.equal(RecommendedModulesApp.DEFAULT_OPTIONS.actions.close, RecommendedModulesApp._onClose);

    // Verify _onClose closes application
    let closeCalled = false;
    const mockApp = {
        close() {
            closeCalled = true;
            return Promise.resolve();
        }
    };
    await RecommendedModulesApp._onClose.call(mockApp);
    assert.equal(closeCalled, true);

    // Verify _formHandler closes application
    closeCalled = false;
    await RecommendedModulesApp._formHandler.call(mockApp);
    assert.equal(closeCalled, true);

    // Verify _onRender binds click listener that triggers close and stops pill propagation
    closeCalled = false;
    let clickHandler = null;
    let defaultPrevented = false;
    let pillClickHandler = null;
    let pillPropagationStopped = false;
    app.close = async () => { closeCalled = true; };
    app.element = {
        querySelector(selector) {
            if (selector.includes('button[data-action="close"]')) {
                return {
                    addEventListener(event, handler) {
                        if (event === 'click') clickHandler = handler;
                    }
                };
            }
            return null;
        },
        querySelectorAll(selector) {
            if (selector.includes('.eskie-patreon-pill')) {
                return [
                    {
                        getAttribute(attr) {
                            if (attr === 'href') return 'https://www.patreon.com/c/EskieEffects';
                            return null;
                        },
                        addEventListener(event, handler) {
                            if (event === 'click') pillClickHandler = handler;
                        }
                    }
                ];
            }
            return [];
        }
    };
    app._onRender({}, {});
    assert.ok(clickHandler);
    clickHandler({
        preventDefault() {
            defaultPrevented = true;
        }
    });
    assert.equal(defaultPrevented, true);
    assert.equal(closeCalled, true);

    assert.ok(pillClickHandler, 'Patreon pill click listener should be registered');
    let openedUrl = null;
    let pillPreventDefault = false;
    let pillStopPropagation = false;
    globalThis.window = {
        electron: {
            shell: {
                openExternal(url) {
                    openedUrl = url;
                }
            }
        }
    };
    pillClickHandler({
        preventDefault() {
            pillPreventDefault = true;
        },
        stopPropagation() {
            pillStopPropagation = true;
        }
    });
    assert.equal(pillPreventDefault, true, 'preventDefault should be called on click');
    assert.equal(pillStopPropagation, true, 'stopPropagation should be called on click');
    assert.equal(openedUrl, 'https://www.patreon.com/c/EskieEffects');

    // Test browser window.open fallback when electron is absent
    let browserOpenedUrl = null;
    globalThis.window = {
        open(url) {
            browserOpenedUrl = url;
        }
    };
    pillClickHandler({
        preventDefault() {},
        stopPropagation() {}
    });
    assert.equal(browserOpenedUrl, 'https://www.patreon.com/c/EskieEffects');
    delete globalThis.window;

    // Verify context preparation
    const context = await app._prepareContext();
    assert.ok(Array.isArray(context.categories));
    assert.ok(context.categories.some(c => c.id === 'assets'));

    // Verify Event Macro Triggering category & subsections
    const eventCategory = context.categories.find(c => c.id === 'eventTriggering');
    assert.ok(eventCategory, 'eventTriggering category must exist');
    assert.ok(eventCategory.subcategories.some(s => s.id === 'regionTriggers'), 'regionTriggers subcategory must exist');
    assert.ok(eventCategory.subcategories.some(s => s.id === 'tileTriggers'), 'tileTriggers subcategory must exist');

    const regionSub = eventCategory.subcategories.find(s => s.id === 'regionTriggers');
    assert.ok(regionSub.modules.some(m => m.id === 'foundry-regions'), 'foundry-regions module must exist');
    assert.equal(regionSub.subStatus, null, 'regionTriggers subcategory header should not have a subStatus pill');

    const tileSub = eventCategory.subcategories.find(s => s.id === 'tileTriggers');
    assert.ok(tileSub.modules.some(m => m.id === 'monks-active-tiles'), 'monks-active-tiles must be in tileTriggers');

    // Verify Tagging subcategory under Functionality
    const funcCategory = context.categories.find(c => c.id === 'functionality');
    assert.ok(funcCategory, 'functionality category must exist');
    assert.ok(funcCategory.subcategories.some(s => s.id === 'tagging'), 'tagging subcategory must exist');
    const taggingSub = funcCategory.subcategories.find(s => s.id === 'tagging');
    assert.ok(taggingSub.modules.some(m => m.id === 'tagger'), 'tagger must be in tagging subcategory');

    // Verify Summoning subcategory under Functionality
    assert.ok(funcCategory.subcategories.some(s => s.id === 'summoning'), 'summoning subcategory must exist');
    const summoningSub = funcCategory.subcategories.find(s => s.id === 'summoning');
    assert.ok(summoningSub.modules.some(m => m.id === 'foundry-summons'), 'foundry-summons must be in summoning subcategory');

    const autoCategory = context.categories.find(c => c.id === 'automation');
    assert.ok(autoCategory);
    assert.ok(autoCategory.modules.some(m => m.id === 'boss-loot-assets-premium'));

    // Verify Patreon URLs on companion modules
    const assetsCategory = context.categories.find(c => c.id === 'assets');
    const visualSub = assetsCategory.subcategories.find(s => s.id === 'visual');
    const soundSub = assetsCategory.subcategories.find(s => s.id === 'sound');

    const eskieEffects = visualSub.modules.find(m => m.id === 'eskie-effects');
    assert.equal(eskieEffects.patreon, 'https://www.patreon.com/c/EskieEffects');

    const jb2a = visualSub.modules.find(m => m.id === 'jb2a_patreon');
    assert.equal(jb2a.patreon, 'https://www.patreon.com/c/JB2A');

    const bossLoot = visualSub.modules.find(m => m.id === 'boss-loot-assets-premium');
    assert.equal(bossLoot.patreon, 'https://www.patreon.com/c/BossLoot');

    const psfx = soundSub.modules.find(m => m.id === 'psfx-patreon');
    assert.equal(psfx.patreon, 'https://www.patreon.com/c/PeriSFX');

    const blfx = autoCategory.modules.find(m => m.id === 'boss-loot-assets-premium');
    assert.equal(blfx.patreon, 'https://www.patreon.com/c/BossLoot');

    const jaamod = visualSub.modules.find(m => m.id === 'jaamod');
    assert.equal(jaamod.patreon, undefined);
});

test('RecommendedModulesApp template includes data-action="close" on close button and clickable Patreon pills', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const templatePath = path.resolve(dirname, '../../src/ui/recommended-modules/recommendedModulesMenu.html');
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    assert.ok(templateContent.includes('data-action="close"'));
    assert.ok(templateContent.includes('EMP.recommendedModules.closeButton'));
    assert.ok(templateContent.includes('eskie-patreon-pill {{patreonClass}}'));
    assert.ok(templateContent.includes('data-patreon-status="{{patreonClass}}"'));
    assert.ok(templateContent.includes('fa-brands fa-patreon'));
    assert.ok(templateContent.includes('target="_blank"'));
    assert.ok(templateContent.includes('rel="noopener noreferrer"'));
    assert.ok(templateContent.includes('EMP.recommendedModules.patreon'));
    assert.equal(templateContent.includes('patreonTooltip'), false, 'Tooltips should be removed from Patreon pills');
    assert.equal(templateContent.includes('title='), false, 'No title tooltip attributes on Patreon pills');
});

test('RecommendedModulesApp assigns warning yellow to Patreon pills when not installed and green when installed', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const cssPath = path.resolve(dirname, '../../styles/eskie-macros.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Verify CSS styles: warning yellow (#facc15 / rgba(234, 179, 8, ...)) and installed green (#4ade80 / rgba(34, 197, 94, ...))
    assert.ok(cssContent.includes('.eskie-patreon-pill.warning'));
    assert.ok(cssContent.includes('.eskie-patreon-pill.installed'));
    assert.ok(cssContent.includes('#facc15'));
    assert.ok(cssContent.includes('#4ade80'));

    const jb2aConfig = {
        id: "jb2a_patreon",
        name: "JB2A",
        altIds: ["JB2A_DnD5e"],
        description: "JB2A animations",
        patreon: "https://www.patreon.com/c/JB2A"
    };

    // Case 1: Neither Patreon nor free version is installed -> warning yellow
    game.modules.clear();
    let processed = processModule(jb2aConfig);
    assert.equal(processed.isPatreonInstalled, false);
    assert.equal(processed.patreonClass, 'warning');
    assert.equal(processed.statusKey, 'missing');

    // Case 2: Only free version is installed and active -> card active, but Patreon pill warning yellow
    game.modules.clear();
    game.modules.set('JB2A_DnD5e', { active: true });
    processed = processModule(jb2aConfig);
    assert.equal(processed.isPatreonInstalled, false);
    assert.equal(processed.patreonClass, 'warning');
    assert.equal(processed.statusKey, 'active');

    // Case 3: Patreon module is installed but disabled -> Patreon pill is installed (green)
    game.modules.clear();
    game.modules.set('jb2a_patreon', { active: false });
    processed = processModule(jb2aConfig);
    assert.equal(processed.isPatreonInstalled, true);
    assert.equal(processed.patreonClass, 'installed');
    assert.equal(processed.statusKey, 'disabled');

    // Case 4: Patreon module is installed and active -> Patreon pill is installed (green)
    game.modules.clear();
    game.modules.set('jb2a_patreon', { active: true });
    processed = processModule(jb2aConfig);
    assert.equal(processed.isPatreonInstalled, true);
    assert.equal(processed.patreonClass, 'installed');
    assert.equal(processed.statusKey, 'active');

    // Case 5: Boss Loot FX in automation category with patreonIds
    const blfxConfig = {
        id: "boss-loot-assets-premium",
        name: "Boss Loot FX",
        altIds: ["blfx-animation-editor-premium", "blfx"],
        patreonIds: ["boss-loot-assets-premium", "blfx-animation-editor-premium"],
        description: "Boss Loot FX",
        patreon: "https://www.patreon.com/c/BossLoot"
    };

    // Free module only -> warning
    game.modules.clear();
    game.modules.set('blfx', { active: true });
    processed = processModule(blfxConfig);
    assert.equal(processed.isPatreonInstalled, false);
    assert.equal(processed.patreonClass, 'warning');

    // Alternative Patreon module installed (blfx-animation-editor-premium) -> installed (green)
    game.modules.clear();
    game.modules.set('blfx-animation-editor-premium', { active: false });
    processed = processModule(blfxConfig);
    assert.equal(processed.isPatreonInstalled, true);
    assert.equal(processed.patreonClass, 'installed');

    // Case 6: Module without Patreon link
    const jaamodConfig = {
        id: "jaamod",
        name: "JAA",
        description: "JAA module"
    };
    processed = processModule(jaamodConfig);
    assert.equal(processed.isPatreonInstalled, false);
    assert.equal(processed.patreonClass, 'warning');
});

test('ConfigureAutorecApp inherits from ApplicationV2 with HandlebarsApplicationMixin and manages module visibility', async () => {
    assert.equal(ConfigureAutorecApp, ConfigureAutorecFormApplication);
    const dialog = new ConfigureAutorecApp();
    assert.ok(dialog);
    assert.equal(ConfigureAutorecApp.DEFAULT_OPTIONS.id, 'empConfigureAutorecMenu');

    // Case 1: No modules active on v14
    game.release = { generation: 14 };
    game.modules.set('autoanimations', { active: false });
    game.modules.set('boss-loot-assets-premium', { active: false });
    game.modules.set('boss-loot-assets-free', { active: false });
    let context = await dialog._prepareContext();
    assert.equal(context.isAaActive, false);
    assert.equal(context.isBlfxActive, false);
    assert.equal(context.hasActiveAutorec, false);
    assert.equal(context.hasMultipleAutorec, false);

    // Case 2: Only Automated Animations active (1 active)
    game.modules.set('autoanimations', { active: true });
    game.modules.set('boss-loot-assets-premium', { active: false });
    context = await dialog._prepareContext();
    assert.equal(context.isAaActive, true);
    assert.equal(context.isBlfxActive, false);
    assert.equal(context.hasActiveAutorec, true);
    assert.equal(context.hasMultipleAutorec, false);

    // Case 3: Free BLFX module active on v14 -> does NOT have autorec
    game.modules.set('autoanimations', { active: false });
    game.modules.set('boss-loot-assets-free', { active: true });
    game.modules.set('boss-loot-assets-premium', { active: false });
    context = await dialog._prepareContext();
    assert.equal(context.isBlfxActive, false);
    assert.equal(context.hasActiveAutorec, false);

    // Case 4: Patreon BLFX module active but on Foundry v12 -> does NOT have autorec
    game.release = { generation: 12 };
    game.modules.set('boss-loot-assets-premium', { active: true });
    context = await dialog._prepareContext();
    assert.equal(context.isBlfxActive, false);
    assert.equal(context.hasActiveAutorec, false);

    // Case 5: Patreon BLFX module active on Foundry v13+ -> IS active
    game.release = { generation: 13 };
    game.modules.set('boss-loot-assets-premium', { active: true });
    context = await dialog._prepareContext();
    assert.equal(context.isAaActive, false);
    assert.equal(context.isBlfxActive, true);
    assert.equal(context.hasActiveAutorec, true);
    assert.equal(context.hasMultipleAutorec, false);

    // Case 6: Both AA and Patreon BLFX active on v14 -> Both active (>= 2)
    game.release = { generation: 14 };
    game.modules.set('autoanimations', { active: true });
    game.modules.set('boss-loot-assets-premium', { active: true });
    context = await dialog._prepareContext();
    assert.equal(context.isAaActive, true);
    assert.equal(context.isBlfxActive, true);
    assert.equal(context.hasActiveAutorec, true);
    assert.equal(context.hasMultipleAutorec, true);
});

test('renderSettingsConfig conditionally hides manageAutorec button when no modules are active', async () => {
    await import('../../src/settings.js');

    const renderHook = Hooks.events.get('renderSettingsConfig')?.[0];
    assert.ok(renderHook);

    const createMockHtml = () => {
        const formGroup = {
            removed: false,
            remove() { this.removed = true; }
        };
        const menuBtn = {
            closest(selector) { return selector === '.form-group' ? formGroup : null; }
        };
        return {
            formGroup,
            querySelector(selector) {
                if (selector.includes('configureAutorec') || selector.includes('manageAutorec')) return menuBtn;
                return null;
            }
        };
    };

    // Case 1: Neither active on v14 -> removed
    game.release = { generation: 14 };
    game.modules.set('autoanimations', { active: false });
    game.modules.set('boss-loot-assets-premium', { active: false });
    game.modules.set('boss-loot-assets-free', { active: false });
    const html1 = createMockHtml();
    renderHook({}, html1, {});
    assert.equal(html1.formGroup.removed, true);

    // Case 2: Only free BLFX on v14 -> removed (free has no autorec)
    game.modules.set('boss-loot-assets-free', { active: true });
    const htmlFree = createMockHtml();
    renderHook({}, htmlFree, {});
    assert.equal(htmlFree.formGroup.removed, true);

    // Case 3: Patreon BLFX on v12 -> removed (requires v13+)
    game.release = { generation: 12 };
    game.modules.set('boss-loot-assets-premium', { active: true });
    const htmlV12 = createMockHtml();
    renderHook({}, htmlV12, {});
    assert.equal(htmlV12.formGroup.removed, true);

    // Case 4: AA active on v12 -> kept
    game.modules.set('autoanimations', { active: true });
    game.modules.set('boss-loot-assets-premium', { active: false });
    const html2 = createMockHtml();
    renderHook({}, html2, {});
    assert.equal(html2.formGroup.removed, false);

    // Case 5: Patreon BLFX active on v13+ -> kept
    game.release = { generation: 13 };
    game.modules.set('autoanimations', { active: false });
    game.modules.set('boss-loot-assets-premium', { active: true });
    const html3 = createMockHtml();
    renderHook({}, html3, {});
    assert.equal(html3.formGroup.removed, false);
});
