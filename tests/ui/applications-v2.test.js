import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BlfxAutorecUpdateApp, BlfxAutorecUpdateFormApplication } from '../../src/adapters/modules/blfx/updateMenu.js';
import { AutorecUpdateApp, autorecUpdateFormApplication } from '../../src/adapters/modules/autoanimations/updateMenu.js';
import { WorldScriptsApp, WorldScriptsFormApplication } from '../../src/world-scripts/worldScriptsMenu.js';
import { RecommendedModulesApp, RecommendedModulesFormApplication } from '../../src/recommended-modules/recommendedModulesMenu.js';
import { AutorecDestinationDialog } from '../../src/adapters/modules/autorec/destinationDialog.js';

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

test('AutorecDestinationDialog inherits from ApplicationV2 with HandlebarsApplicationMixin', async () => {
    const dialog = new AutorecDestinationDialog();
    assert.ok(dialog);
    assert.equal(AutorecDestinationDialog.DEFAULT_OPTIONS.id, 'empAutorecDestinationDialog');

    const context = await dialog._prepareContext();
    assert.ok('currentTarget' in context);
});
