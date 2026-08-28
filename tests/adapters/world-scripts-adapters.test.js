import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BaseSystemAdapter } from '../../src/world-scripts/adapters/system/base.js';
import { Dnd5eAdapter } from '../../src/world-scripts/adapters/system/dnd5e.js';
import { Pf2eAdapter } from '../../src/world-scripts/adapters/system/pf2e.js';
import { GenericAdapter } from '../../src/world-scripts/adapters/system/generic.js';
import { midiQolAdapter } from '../../src/world-scripts/adapters/module/midiQol.js';
import { parseAndNormalizeAbility, BASE_ABILITY_MAP } from '../../src/world-scripts/adapters/helper.js';

test('world-scripts adapters re-export classes and functions cleanly', () => {
    assert.ok(BaseSystemAdapter);
    assert.ok(Dnd5eAdapter);
    assert.ok(Pf2eAdapter);
    assert.ok(GenericAdapter);
    assert.ok(midiQolAdapter);
    assert.ok(parseAndNormalizeAbility);
    assert.ok(BASE_ABILITY_MAP);

    const dnd = new Dnd5eAdapter();
    assert.equal(dnd.id, 'dnd5e');
    assert.equal(dnd.isSupported, true);

    const pf = new Pf2eAdapter();
    assert.equal(pf.id, 'pf2e');
    assert.equal(pf.isSupported, true);

    const gen = new GenericAdapter();
    assert.equal(gen.id, 'generic');
    assert.equal(gen.isSupported, false);
});
