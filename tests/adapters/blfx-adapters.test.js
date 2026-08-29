import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { blfx, EMP_BLFX_Registry, buildBlfxPayload, mergeBlfxCustomAutoRec } from '../../src/adapters/modules/blfx/blfx-module-adapter.js';
import { generateBlfxAutorecUpdate, readExistingBlfxData, groupBlfxEntriesByTrigger } from '../../src/ui/blfx/updateMenu.js';

test('blfx.register creates robustly keyed entries in EMP_BLFX_Registry', () => {
    blfx.register('fireball', 'template', 'eskie.effect.fireball', { speed: 1 }, '1.0.0', 'Fireball', {
        systemId: 'dnd5e',
        itemName: 'Fireball',
        activityName: 'Cast',
    });

    assert.ok(EMP_BLFX_Registry['dnd5e']);
    assert.ok(EMP_BLFX_Registry['dnd5e']['fireball']);
    assert.ok(EMP_BLFX_Registry['dnd5e']['fireball']['cast']);
    assert.ok(EMP_BLFX_Registry['dnd5e']['fireball']['cast']['createTemplate']);

    const entry = EMP_BLFX_Registry['dnd5e']['fireball']['cast']['createTemplate'];
    assert.equal(entry.itemName, 'Fireball');
    assert.equal(entry.activityName, 'Cast');
    assert.equal(entry.triggerName, 'After Template Create');
    assert.equal(entry.note, 'Eskie Macro Pack (1.0.0)');
    assert.equal(entry.animationData.macroType, 'Template');
    assert.equal(entry.animationData.activityName, 'Cast');
    assert.equal(entry.animationData.activityType, 'cast');
    assert.deepEqual(entry.animationData.primaryAnimation, {});
    assert.deepEqual(entry.animationData.secondaryAnimation, {});
    assert.deepEqual(entry.animationData.thirdAnimation, {});
    assert.ok(entry.animationData.command.includes('eskie.effect.fireball'));
    assert.ok(entry.animationData.command.includes('templateDocument'));
});

test('blfx.register maps active effects to afterActiveEffects and On Target or Token (AE)', () => {
    blfx.register('rage', 'effect', 'eskie.effect.rage', { color: 'red' }, '1.0.0', 'Rage', {
        systemId: 'dnd5e',
        itemName: 'Rage',
        activityName: 'Rage',
    });

    assert.ok(EMP_BLFX_Registry['dnd5e']['rage']['rage']['afterActiveEffects']);
    const entry = EMP_BLFX_Registry['dnd5e']['rage']['rage']['afterActiveEffects'];
    assert.equal(entry.triggerName, 'After Active Effects');
    assert.equal(entry.animationData.macroType, 'On Target or Token (AE)');
    assert.ok(entry.animationData.command.includes('eskie.effect.rage'));
    assert.ok(entry.animationData.command.includes('activeEffect'));
});

test('blfx.register allows configuring multiple activities for a single item when explicit activity names are provided', () => {
    blfx.register('dagger', 'melee-target', 'eskie.effect.daggerMelee', {}, '1.0.0', 'Dagger', { activityName: 'Melee Attack' });
    blfx.register('dagger', 'ranged-target', 'eskie.effect.daggerThrown', {}, '1.0.0', 'Dagger', { activityName: 'Thrown Attack' });

    assert.ok(EMP_BLFX_Registry['dnd5e']['dagger']['melee-attack']['afterAttack']);
    assert.equal(EMP_BLFX_Registry['dnd5e']['dagger']['melee-attack']['afterAttack'].animationData.macroType, 'Attack Melee');

    assert.ok(EMP_BLFX_Registry['dnd5e']['dagger']['thrown-attack']['afterAttack']);
    assert.equal(EMP_BLFX_Registry['dnd5e']['dagger']['thrown-attack']['afterAttack'].animationData.macroType, 'Attack Ranged');
});

test('blfx.register populates activityName, activityType, and animation slots with custom options support', () => {
    blfx.register('teleport', 'token', 'eskie.effect.teleport', {}, '1.0.0', 'Teleport', {
        activityName: 'Misty Step',
        activityType: 'cast',
        primaryAnimation: {
            enabled: true,
            fileName: 'blfx.spell.cast.circles1.energy1.blue',
            scale: 1.5
        },
        secondaryAnimation: {},
        thirdAnimation: {
            enabled: true,
            fileName: 'blfx.spell.cast.circles2.energy1.smoke.orange',
            scale: 1.6
        }
    });

    const entry = EMP_BLFX_Registry['dnd5e']['teleport']['misty-step']['afterItemUse'];
    assert.ok(entry);
    assert.equal(entry.animationData.activityName, 'Misty Step');
    assert.equal(entry.animationData.activityType, 'cast');
    assert.equal(entry.animationData.primaryAnimation.enabled, true);
    assert.equal(entry.animationData.primaryAnimation.fileName, 'blfx.spell.cast.circles1.energy1.blue');
    assert.deepEqual(entry.animationData.secondaryAnimation, {});
    assert.equal(entry.animationData.thirdAnimation.enabled, true);
    assert.equal(entry.animationData.thirdAnimation.fileName, 'blfx.spell.cast.circles2.energy1.smoke.orange');
});

test('groupBlfxEntriesByTrigger groups entries into preferred section and sub-section order', () => {
    const rawEntries = [
        { itemName: 'Shield', triggerName: 'After Attack Roll', triggerMode: 'afterAttack', macroType: 'On Target or Token' },
        { itemName: '(Melee) Dagger', triggerName: 'After Attack Roll', triggerMode: 'afterAttack', macroType: 'Attack Melee' },
        { itemName: '(Ranged) Dagger', triggerName: 'After Attack Roll', triggerMode: 'afterAttack', macroType: 'Attack Ranged' },
        { itemName: 'Fireball', triggerName: 'After Template Create', triggerMode: 'createTemplate' },
        { itemName: 'Rage', triggerName: 'After Active Effects', triggerMode: 'afterActiveEffects' },
        { itemName: 'Bless', triggerName: 'After Activity Use (Default)', triggerMode: 'afterItemUse' },
        { itemName: '(Melee) Divine Strike', triggerName: 'After Damage Roll', triggerMode: 'afterDamage', macroType: 'Attack Melee' },
        { itemName: '(Ranged) Divine Strike', triggerName: 'After Damage Roll', triggerMode: 'afterDamage', macroType: 'Attack Ranged' }
    ];

    const sections = groupBlfxEntriesByTrigger(rawEntries);
    assert.equal(sections.length, 5);
    assert.equal(sections[0].triggerName, 'After Activity Use (Default)');
    assert.equal(sections[1].triggerName, 'After Attack Roll');
    assert.equal(sections[2].triggerName, 'After Damage Roll');
    assert.equal(sections[3].triggerName, 'After Active Effects');
    assert.equal(sections[4].triggerName, 'After Template Create');

    // Subsections within After Attack Roll
    assert.equal(sections[1].subsections.length, 3);
    assert.equal(sections[1].subsections[0].subTriggerName, 'Melee');
    assert.equal(sections[1].subsections[0].entries[0].itemName, '(Melee) Dagger');
    assert.equal(sections[1].subsections[1].subTriggerName, 'Ranged');
    assert.equal(sections[1].subsections[1].entries[0].itemName, '(Ranged) Dagger');
    assert.equal(sections[1].subsections[2].subTriggerName, 'On Token');
    assert.equal(sections[1].subsections[2].entries[0].itemName, 'Shield');

    // Subsections within After Damage Roll
    assert.equal(sections[2].subsections.length, 2);
    assert.equal(sections[2].subsections[0].subTriggerName, 'Melee');
    assert.equal(sections[2].subsections[0].entries[0].itemName, '(Melee) Divine Strike');
    assert.equal(sections[2].subsections[1].subTriggerName, 'Ranged');
    assert.equal(sections[2].subsections[1].entries[0].itemName, '(Ranged) Divine Strike');

    // Flat entries preservation
    assert.equal(sections[0].entries[0].itemName, 'Bless');
    assert.equal(sections[1].entries[0].itemName, '(Melee) Dagger');
    assert.equal(sections[1].entries[1].itemName, '(Ranged) Dagger');
    assert.equal(sections[1].entries[2].itemName, 'Shield');
    assert.equal(sections[3].entries[0].itemName, 'Rage');
    assert.equal(sections[4].entries[0].itemName, 'Fireball');
});

test('buildBlfxPayload constructs valid resources payload with multi-package compatibility flags', () => {
    const payload = buildBlfxPayload();
    assert.ok(payload.flags['boss-loot-assets-premium'].customAutoRecognition);
    assert.ok(payload.flags['boss-loot-assets-free'].customAutoRecognition);
    assert.ok(payload.flags['blfx'].customAutoRecognition);
    assert.ok(payload.customAutoRecognition);
});

test('mergeBlfxCustomAutoRec non-destructively handles stringified JSON, empty objects, and custom user entries', () => {
    const existingStringified = JSON.stringify({
        customAutoRecognition: {
            dnd5e: {
                customSpell: {
                    default: {
                        afterItemUse: {
                            animationName: 'Custom Spell',
                            note: 'User Custom Note',
                            animationData: { command: '// custom' }
                        }
                    }
                }
            }
        }
    });

    const testEmpRegistry = {
        dnd5e: {
            fireball: {
                cast: {
                    afterItemUse: {
                        animationName: 'Fireball',
                        note: 'Eskie Macro Pack (1.0.0)',
                        animationData: { command: '// emp' }
                    }
                }
            }
        }
    };

    const merged = mergeBlfxCustomAutoRec(existingStringified, testEmpRegistry);
    assert.ok(merged.customAutoRecognition.dnd5e.customSpell.default.afterItemUse);
    assert.equal(merged.customAutoRecognition.dnd5e.customSpell.default.afterItemUse.note, 'User Custom Note');
    assert.ok(merged.customAutoRecognition.dnd5e.fireball.cast.afterItemUse);
    assert.equal(merged.customAutoRecognition.dnd5e.fireball.cast.afterItemUse.note, 'Eskie Macro Pack (1.0.0)');
});

test('generateBlfxAutorecUpdate and readExistingBlfxData handle settings seamlessly', async () => {
    const testRegistry = {
        dnd5e: {
            sample: {
                default: {
                    afterAttack: {
                        animationName: 'Sample Attack',
                        note: 'Eskie Macro Pack (1.0.0)',
                        animationData: { command: '// test' }
                    }
                }
            }
        }
    };

    const initialRead = readExistingBlfxData();
    assert.ok(typeof initialRead === 'object');

    const result = await generateBlfxAutorecUpdate(testRegistry);
    assert.ok(result);
    assert.ok(Array.isArray(result.missingEntries));
    assert.ok(Array.isArray(result.updatedEntries));
    assert.ok(Array.isArray(result.customEntries));
    assert.ok(result.newPayload.customAutoRecognition.dnd5e.sample.default.afterAttack);
});

test('isBlfxCustomAutoRecUpdatesEnabled detects boss-loot-assets-premium.blfxCustomAutoRecUpdates setting', async () => {
    const { isBlfxCustomAutoRecUpdatesEnabled, promptEnableBlfxUpdates } = await import('../../src/adapters/modules/blfx/blfx-module-adapter.js');

    // When unset
    assert.equal(isBlfxCustomAutoRecUpdatesEnabled(), false);

    // Mock setting enabled
    game.settings.settings = new Map();
    game.settings.settings.set('boss-loot-assets-premium.blfxCustomAutoRecUpdates', {
        namespace: 'boss-loot-assets-premium',
        key: 'blfxCustomAutoRecUpdates',
        default: false
    });

    const origGet = game.settings.get;
    game.settings.get = (mod, key) => {
        if (key === 'blfxCustomAutoRecUpdates') return true;
        return origGet(mod, key);
    };

    assert.equal(isBlfxCustomAutoRecUpdatesEnabled(), true);

    game.settings.get = (mod, key) => {
        if (key === 'blfxCustomAutoRecUpdates') return false;
        return origGet(mod, key);
    };

    assert.equal(isBlfxCustomAutoRecUpdatesEnabled(), false);
    game.settings.get = origGet;
});

test('BlfxEnableUpdatesDialog inherits from ApplicationV2 and promptEnableBlfxUpdates renders it', async () => {
    const { BlfxEnableUpdatesDialog, promptEnableBlfxUpdates } = await import('../../src/adapters/modules/blfx/blfx-module-adapter.js');
    const dialog = new BlfxEnableUpdatesDialog();
    assert.ok(dialog);
    assert.equal(BlfxEnableUpdatesDialog.DEFAULT_OPTIONS.id, 'empBlfxEnableUpdatesDialog');
    assert.ok(BlfxEnableUpdatesDialog.PARTS.content.template.includes('enableUpdatesPrompt.html'));

    const rendered = await promptEnableBlfxUpdates();
    assert.ok(rendered);
    assert.equal(rendered.rendered, true);
    await rendered.close();
});

test('BlfxModuleAdapter.submit scans first and only prompts when new animations exist and updates are disabled', async () => {
    const { blfxAdapter } = await import('../../src/adapters/modules/blfx/blfx-module-adapter.js');

    let promptCalled = false;
    const origPrompt = blfxAdapter.promptEnableBlfxUpdates;
    blfxAdapter.promptEnableBlfxUpdates = async () => {
        promptCalled = true;
    };

    // Ensure BLFX autorec is available
    const origIsAutorec = blfxAdapter.isAutorecSupported;
    blfxAdapter.isAutorecSupported = () => true;

    // Simulate updates disabled
    const origIsEnabled = blfxAdapter.isCustomAutoRecUpdatesEnabled;
    blfxAdapter.isCustomAutoRecUpdatesEnabled = () => false;

    // Case 1: Registry has NO changes compared to existing data
    const origRegistry = { ...blfxAdapter.registry };
    for (const k of Object.keys(blfxAdapter.registry)) delete blfxAdapter.registry[k];

    await blfxAdapter.submit(true);
    assert.equal(promptCalled, false, 'Should NOT prompt when there are no new animations');

    // Case 2: Registry HAS new animations and updates are disabled
    blfxAdapter.registry['dnd5e'] = {
        newSpell: {
            default: {
                afterAttack: {
                    animationName: 'New Spell',
                    note: 'Eskie Macro Pack (9.9.9)',
                    animationData: { command: '// test' }
                }
            }
        }
    };

    await blfxAdapter.submit(true);
    assert.equal(promptCalled, true, 'SHOULD prompt when new animations exist and updates are disabled');

    // Restore
    blfxAdapter.promptEnableBlfxUpdates = origPrompt;
    blfxAdapter.isAutorecSupported = origIsAutorec;
    blfxAdapter.isCustomAutoRecUpdatesEnabled = origIsEnabled;
    for (const k of Object.keys(blfxAdapter.registry)) delete blfxAdapter.registry[k];
    Object.assign(blfxAdapter.registry, origRegistry);
});

test('submit does not re-prompt on subsequent loads for a non-development release when updates were not applied', async () => {
    const { blfxAdapter } = await import('../../src/adapters/modules/blfx/blfx-module-adapter.js');
    const { MODULE_ID } = await import('../../src/lib/constants.js');

    // Simulate non-development module version
    game.modules.set(MODULE_ID, {
        id: MODULE_ID,
        version: '1.2.0',
        active: true
    });

    let promptCount = 0;
    const origPrompt = blfxAdapter.promptEnableBlfxUpdates;
    blfxAdapter.promptEnableBlfxUpdates = async () => {
        promptCount++;
    };

    const origIsAutorec = blfxAdapter.isAutorecSupported;
    blfxAdapter.isAutorecSupported = () => true;

    const origIsEnabled = blfxAdapter.isCustomAutoRecUpdatesEnabled;
    blfxAdapter.isCustomAutoRecUpdatesEnabled = () => false;

    // Populate registry with an unapplied animation
    const origRegistry = { ...blfxAdapter.registry };
    for (const k of Object.keys(blfxAdapter.registry)) delete blfxAdapter.registry[k];
    blfxAdapter.registry['dnd5e'] = {
        unappliedSpell: {
            default: {
                afterAttack: {
                    animationName: 'Unapplied Spell',
                    note: 'Eskie Macro Pack (1.2.0)',
                    animationData: { command: '// test' }
                }
            }
        }
    };

    // First load: should prompt once
    let blfxVersionInSetting = '0.0.0';
    const origGet = game.settings.get;
    const origSet = game.settings.set;
    game.settings.get = (mod, key) => {
        if (key === 'blfxAutorecVersion') return blfxVersionInSetting;
        return origGet(mod, key);
    };
    game.settings.set = async (mod, key, val) => {
        if (key === 'blfxAutorecVersion') {
            blfxVersionInSetting = val;
            return val;
        }
        return origSet(mod, key, val);
    };

    await blfxAdapter.submit(false);
    assert.equal(promptCount, 1, 'Should prompt on first load of version 1.2.0');
    assert.equal(blfxVersionInSetting, '1.2.0', 'Setting should record version 1.2.0');

    // Subsequent load with same version 1.2.0: should NOT prompt again
    await blfxAdapter.submit(false);
    assert.equal(promptCount, 1, 'Should NOT prompt again on next load of same version');

    // Restore
    game.settings.get = origGet;
    game.settings.set = origSet;
    blfxAdapter.promptEnableBlfxUpdates = origPrompt;
    blfxAdapter.isAutorecSupported = origIsAutorec;
    blfxAdapter.isCustomAutoRecUpdatesEnabled = origIsEnabled;
    for (const k of Object.keys(blfxAdapter.registry)) delete blfxAdapter.registry[k];
    Object.assign(blfxAdapter.registry, origRegistry);
});
