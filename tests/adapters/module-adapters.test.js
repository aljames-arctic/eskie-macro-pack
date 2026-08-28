import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeModuleAdapters, hasActiveModuleAdapters, MidiQolModuleAdapter } from '../../src/adapters/module/index.js';

test('initializeModuleAdapters and hasActiveModuleAdapters detect active modules', () => {
    game.modules = new Map([
        ['midi-qol', { id: 'midi-qol', active: true }]
    ]);

    assert.equal(hasActiveModuleAdapters(), true);
    const activeMap = initializeModuleAdapters();
    assert.equal(activeMap.size, 1);
    assert.ok(activeMap.get('midi-qol') instanceof MidiQolModuleAdapter);
});

test('MidiQolModuleAdapter parses flags and HTML saves display with DOMParser', () => {
    const adapter = new MidiQolModuleAdapter();

    // Single target success flag
    const flagMsg = {
        id: 'midi-msg-1',
        flags: {
            'midi-qol': {
                messageType: 'save',
                isSuccess: true
            }
        }
    };
    const flagRolls = adapter.extractRolls(flagMsg);
    assert.equal(flagRolls.outcome, 'success');
    assert.equal(flagRolls.rolls.length, 1);
    assert.equal(flagRolls.rolls[0].source, 'midi-qol-flags');

    // Multi-target HTML saves display card
    globalThis.DOMParser = class DOMParser {
        parseFromString(htmlString) {
            return {
                querySelector: (sel) => {
                    if (sel === '.midi-qol-saves-display') {
                        return {
                            textContent: 'Dexterity Saving Throw',
                            querySelectorAll: (_itemSel) => [
                                {
                                    dataset: { id: 'target-token-1' },
                                    classList: { contains: (c) => c === 'success' },
                                    querySelector: () => null
                                },
                                {
                                    dataset: { id: 'target-token-2' },
                                    classList: { contains: (c) => c === 'failure' },
                                    querySelector: () => null
                                }
                            ]
                        };
                    }
                    return null;
                }
            };
        }
    };

    const htmlMsg = {
        id: 'midi-msg-html',
        content: '<div class="midi-qol midi-qol-saves-display">...</div>'
    };

    const htmlRolls = adapter.extractRolls(htmlMsg);
    assert.equal(htmlRolls.rolls.length, 2);
    assert.equal(htmlRolls.rolls[0].tokenId, 'target-token-1');
    assert.equal(htmlRolls.rolls[0].outcome, 'success');
    assert.equal(htmlRolls.rolls[0].rawAbility, 'dexterity');

    assert.equal(htmlRolls.rolls[1].tokenId, 'target-token-2');
    assert.equal(htmlRolls.rolls[1].outcome, 'failure');
    assert.equal(htmlRolls.rolls[1].rawAbility, 'dexterity');
});
