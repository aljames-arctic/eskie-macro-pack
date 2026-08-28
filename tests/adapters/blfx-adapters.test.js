import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { blfx, EMP_BLFX_Registry, buildBlfxPayload, mergeBlfxCustomAutoRec } from '../../src/adapters/modules/blfx/blfx.js';
import { generateBlfxAutorecUpdate, readExistingBlfxData, BlfxAutorecUpdateApp } from '../../src/adapters/modules/blfx/updateMenu.js';

test('blfx.register creates robustly keyed entries in EMP_BLFX_Registry', () => {
    blfx.register('fireball', 'template', 'eskie.effect.fireball', { speed: 1 }, '1.0.0', 'Fireball', {
        systemId: 'dnd5e',
        itemName: 'Fireball',
        activityName: 'Cast',
    });

    assert.ok(EMP_BLFX_Registry['dnd5e']);
    assert.ok(EMP_BLFX_Registry['dnd5e']['fireball']);
    assert.ok(EMP_BLFX_Registry['dnd5e']['fireball']['cast']);
    assert.ok(EMP_BLFX_Registry['dnd5e']['fireball']['cast']['afterItemUse']);

    const entry = EMP_BLFX_Registry['dnd5e']['fireball']['cast']['afterItemUse'];
    assert.equal(entry.itemName, 'Fireball');
    assert.equal(entry.activityName, 'Cast');
    assert.equal(entry.note, 'Eskie Macro Pack (1.0.0)');
    assert.ok(entry.animationData.command.includes('eskie.effect.fireball'));
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
