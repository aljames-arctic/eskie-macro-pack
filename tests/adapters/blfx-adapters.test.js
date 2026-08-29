import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { blfx, EMP_BLFX_Registry, buildBlfxPayload, mergeBlfxCustomAutoRec } from '../../src/adapters/modules/blfx/blfx.js';
import { generateBlfxAutorecUpdate, readExistingBlfxData, groupBlfxEntriesByTrigger, BlfxAutorecUpdateApp } from '../../src/ui/blfx/updateMenu.js';

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
    assert.equal(sections.length, 8);
    assert.equal(sections[0].triggerName, 'After Activity Use (Default)');
    assert.equal(sections[1].triggerName, 'After Attack Roll (Melee)');
    assert.equal(sections[2].triggerName, 'After Attack Roll (Ranged)');
    assert.equal(sections[3].triggerName, 'After Attack Roll (On Token)');
    assert.equal(sections[4].triggerName, 'After Damage Roll (Melee)');
    assert.equal(sections[5].triggerName, 'After Damage Roll (Ranged)');
    assert.equal(sections[6].triggerName, 'After Active Effects');
    assert.equal(sections[7].triggerName, 'After Template Create');
    assert.equal(sections[0].entries[0].itemName, 'Bless');
    assert.equal(sections[1].entries[0].itemName, '(Melee) Dagger');
    assert.equal(sections[2].entries[0].itemName, '(Ranged) Dagger');
    assert.equal(sections[3].entries[0].itemName, 'Shield');
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
