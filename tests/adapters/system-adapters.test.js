import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeSystemAdapter, BaseSystemAdapter } from '../../src/adapters/system/index.js';
import { Dnd5eSystemAdapter } from '../../src/adapters/system/dnd5e-system-adapter.js';
import { Pf2eSystemAdapter } from '../../src/adapters/system/pf2e-system-adapter.js';
import { GenericSystemAdapter } from '../../src/adapters/system/generic-system-adapter.js';
import { BaseFoundryAdapter } from '../../src/adapters/foundry/index.js';
import { FoundryV12Adapter } from '../../src/adapters/foundry/foundry-v12-adapter.js';
import { FoundryV13Adapter } from '../../src/adapters/foundry/foundry-v13-adapter.js';
import { FoundryV14Adapter } from '../../src/adapters/foundry/foundry-v14-adapter.js';

test('initializeSystemAdapter and BaseSystemAdapter enforce instanceof BaseFoundryAdapter contract across all versions', async () => {
    // Non-BaseFoundryAdapter inputs are rejected
    assert.throws(() => new BaseSystemAdapter('dnd5e', true, {}), /BaseSystemAdapter requires a valid BaseFoundryAdapter instance/);
    assert.throws(() => new BaseSystemAdapter('dnd5e', true, 'invalid'), /BaseSystemAdapter requires a valid BaseFoundryAdapter instance/);
    await assert.rejects(async () => initializeSystemAdapter('dnd5e', {}), /initializeSystemAdapter requires a valid BaseFoundryAdapter instance/);

    // All version subclasses (V12, V13, V14) satisfy instanceof BaseFoundryAdapter
    const v12 = new FoundryV12Adapter();
    const v13 = new FoundryV13Adapter();
    const v14 = new FoundryV14Adapter();

    assert.ok(v12 instanceof BaseFoundryAdapter);
    assert.ok(v13 instanceof BaseFoundryAdapter);
    assert.ok(v14 instanceof BaseFoundryAdapter);

    // System adapters accept any Foundry adapter version polymorphically
    const sysV12 = await initializeSystemAdapter('dnd5e', v12);
    assert.ok(sysV12 instanceof Dnd5eSystemAdapter);
    assert.equal(sysV12.foundry, v12);

    const sysV13 = await initializeSystemAdapter('pf2e', v13);
    assert.ok(sysV13 instanceof Pf2eSystemAdapter);
    assert.equal(sysV13.foundry, v13);

    const sysV14 = await initializeSystemAdapter('generic', v14);
    assert.ok(sysV14 instanceof GenericSystemAdapter);
    assert.equal(sysV14.foundry, v14);
});

test('initializeSystemAdapter instantiates matching system adapter or generic fallback', async () => {
    const dnd5e = await initializeSystemAdapter('dnd5e');
    assert.ok(dnd5e instanceof Dnd5eSystemAdapter);
    assert.equal(dnd5e.isSupported, true);

    const pf2e = await initializeSystemAdapter('pf2e');
    assert.ok(pf2e instanceof Pf2eSystemAdapter);
    assert.equal(pf2e.isSupported, true);

    const generic = await initializeSystemAdapter('generic');
    assert.ok(generic instanceof GenericSystemAdapter);
    assert.equal(generic.isSupported, false);

    const unsupported = await initializeSystemAdapter('shadowdark');
    assert.ok(unsupported instanceof GenericSystemAdapter);
    assert.equal(unsupported.isSupported, false);
});

test('Dnd5eSystemAdapter qualifies messages and extracts rolls from flags', () => {
    const adapter = new Dnd5eSystemAdapter();

    // Core D&D 5e save message
    const saveMsg = {
        id: 'msg-save',
        flags: {
            dnd5e: {
                roll: {
                    type: 'save',
                    ability: 'dex'
                }
            }
        }
    };
    assert.equal(adapter.qualifyMessage(saveMsg), 'saving throw');
    const saveRolls = adapter.extractRolls(saveMsg);
    assert.equal(saveRolls.length, 1);
    assert.equal(saveRolls[0].rawAbility, 'dex');
    assert.equal(adapter.normalizeAbility(saveRolls[0].rawAbility), 'dexterity');

    // Ability check
    const checkMsg = {
        id: 'msg-check',
        flags: {
            dnd5e: {
                roll: {
                    type: 'skill',
                    ability: 'ath'
                }
            }
        }
    };
    assert.equal(adapter.qualifyMessage(checkMsg), 'ability check');
    const checkRolls = adapter.extractRolls(checkMsg);
    assert.equal(adapter.normalizeAbility(checkRolls[0].rawAbility), 'strength');

    // Attack
    const atkMsg = { id: 'msg-atk', flags: { dnd5e: { roll: { type: 'attack' } } } };
    assert.equal(adapter.qualifyMessage(atkMsg), 'attack');

    // Damage
    const dmgMsg = { id: 'msg-dmg', flags: { dnd5e: { roll: { type: 'damage' } } } };
    assert.equal(adapter.qualifyMessage(dmgMsg), 'damage');

    // Item usage
    const useMsg = { id: 'msg-use', flags: { dnd5e: { messageType: 'usage' } } };
    assert.equal(adapter.qualifyMessage(useMsg), 'item description');
});

test('Dnd5eSystemAdapter getSpellLevel and getCreatureType contracts', () => {
    const adapter = new Dnd5eSystemAdapter();

    // Spell Level from aaHandler
    assert.equal(adapter.getSpellLevel({ aaHandler: { systemData: { spellLevel: 3 } } }), 3);
    // Spell Level from item
    assert.equal(adapter.getSpellLevel({ item: { system: { level: 2 } } }), 2);

    // Creature Type
    const actor = {
        system: {
            details: {
                type: {
                    value: 'Fiend'
                }
            }
        }
    };
    assert.equal(adapter.getCreatureType(actor), 'fiend');
});

test('Pf2eSystemAdapter qualifies messages, extracts rolls, and normalizes skills', () => {
    const adapter = new Pf2eSystemAdapter();

    const saveMsg = {
        id: 'pf2e-save',
        speaker: { token: 'tok1' },
        flags: {
            pf2e: {
                context: {
                    type: 'saving-throw',
                    outcome: 'criticalSuccess',
                    ability: 'fortitude'
                }
            }
        }
    };
    assert.equal(adapter.qualifyMessage(saveMsg), 'saving throw');
    const rolls = adapter.extractRolls(saveMsg);
    assert.equal(rolls.length, 1);
    assert.equal(rolls[0].outcome, 'success');
    assert.equal(rolls[0].tokenId, 'tok1');
    assert.equal(adapter.normalizeAbility(rolls[0].rawAbility), 'constitution');

    const checkMsg = {
        id: 'pf2e-check',
        flags: {
            pf2e: {
                context: {
                    type: 'perception-check',
                    outcome: 'failure',
                    ability: 'perception'
                }
            }
        }
    };
    assert.equal(adapter.qualifyMessage(checkMsg), 'ability check');
    const checkRolls = adapter.extractRolls(checkMsg);
    assert.equal(checkRolls[0].outcome, 'failure');
    assert.equal(adapter.normalizeAbility(checkRolls[0].rawAbility), 'wisdom');
});

test('GenericSystemAdapter qualifies messages based on keyword text analysis', () => {
    const adapter = new GenericSystemAdapter();

    const saveMsg = {
        id: 'gen-save',
        content: 'Rolling a Dexterity Saving Throw!',
        rolls: [{ total: 18 }]
    };
    assert.equal(adapter.qualifyMessage(saveMsg), 'saving throw');

    const checkMsg = {
        id: 'gen-check',
        flavor: 'Athletics Skill Check',
        rolls: [{ total: 15 }]
    };
    assert.equal(adapter.qualifyMessage(checkMsg), 'ability check');

    const chatTextOnly = {
        id: 'gen-chat',
        content: 'Hello everyone!'
    };
    assert.equal(adapter.qualifyMessage(chatTextOnly), 'text');
});
