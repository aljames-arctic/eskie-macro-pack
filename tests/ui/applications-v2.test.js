import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    BlfxAutorecUpdateApp,
    BlfxAutorecUpdateFormApplication,
    AutorecUpdateApp,
    autorecUpdateFormApplication,
    WorldScriptsApp,
    WorldScriptsFormApplication,
    RecommendedModulesApp,
    RecommendedModulesFormApplication,
    ManageAutorecApp,
    ManageAutorecFormApplication,
    AutorecDestinationDialog
} from '../../src/ui/index.js';

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

    const rendered = await app.render(true);
    assert.equal(rendered.rendered, true);
    await app.close();
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

test('RecommendedModulesApp inherits from ApplicationV2 with HandlebarsApplicationMixin', async () => {
    assert.equal(RecommendedModulesApp, RecommendedModulesFormApplication);
    const app = new RecommendedModulesApp();
    assert.ok(app);
    assert.equal(RecommendedModulesApp.DEFAULT_OPTIONS.id, 'eskie-recommended-modules-menu');

    const context = await app._prepareContext();
    assert.ok(Array.isArray(context.categories));
    assert.ok(context.categories.some(c => c.id === 'assets'));
});

test('ManageAutorecApp inherits from ApplicationV2 with HandlebarsApplicationMixin and manages module visibility', async () => {
    assert.equal(ManageAutorecApp, ManageAutorecFormApplication);
    const dialog = new ManageAutorecApp();
    assert.ok(dialog);
    assert.equal(ManageAutorecApp.DEFAULT_OPTIONS.id, 'empManageAutorecMenu');

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

    // Case 5: Patreon BLFX module active on Foundry v14+ -> IS active
    game.release = { generation: 14 };
    game.modules.set('boss-loot-assets-premium', { active: true });
    context = await dialog._prepareContext();
    assert.equal(context.isAaActive, false);
    assert.equal(context.isBlfxActive, true);
    assert.equal(context.hasActiveAutorec, true);
    assert.equal(context.hasMultipleAutorec, false);

    // Case 6: Both AA and Patreon BLFX active on v14 -> Both active (>= 2)
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
                if (selector.includes('manageAutorec')) return menuBtn;
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

    // Case 3: Patreon BLFX on v12 -> removed (requires v14+)
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

    // Case 5: Patreon BLFX active on v14 -> kept
    game.release = { generation: 14 };
    game.modules.set('autoanimations', { active: false });
    game.modules.set('boss-loot-assets-premium', { active: true });
    const html3 = createMockHtml();
    renderHook({}, html3, {});
    assert.equal(html3.formGroup.removed, false);
});

