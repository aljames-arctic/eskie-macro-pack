import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    initializeModuleAdapters,
    hasActiveModuleAdapters,
    BaseModuleAdapter,
    MidiQolModuleAdapter,
    AutoanimationsModuleAdapter,
    autoanimationsAdapter,
    BlfxModuleAdapter,
    blfxAdapter,
    SocketlibModuleAdapter,
    socketlibAdapter,
    AutorecManager,
    autorecManager,
    MassEditModuleAdapter,
    massEditAdapter,
    TokenAttacherModuleAdapter,
    tokenAttacherAdapter
} from '../../src/adapters/modules/index.js';
import { adapter } from '../../src/adapters/index.js';

test('initializeModuleAdapters and hasActiveModuleAdapters detect active modules', () => {
    game.modules = new Map([
        ['midi-qol', { id: 'midi-qol', active: true }],
        ['autoanimations', { id: 'autoanimations', active: true }],
        ['blfx', { id: 'blfx', active: true }],
        ['socketlib', { id: 'socketlib', active: true }]
    ]);

    assert.equal(hasActiveModuleAdapters(), true);
    const activeMap = initializeModuleAdapters();
    assert.equal(activeMap.size, 4);
    assert.ok(activeMap.get('midi-qol') instanceof MidiQolModuleAdapter);
    assert.ok(activeMap.get('autoanimations') instanceof AutoanimationsModuleAdapter);
    assert.ok(activeMap.get('blfx') instanceof BlfxModuleAdapter);
    assert.ok(activeMap.get('socketlib') instanceof SocketlibModuleAdapter);
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

test('AutoanimationsModuleAdapter standardizes triggers and generates compliant autorec entries', () => {
    const aa = new AutoanimationsModuleAdapter();
    assert.equal(aa.standardizeTrigger('token'), 'ontoken');
    assert.equal(aa.standardizeTrigger('template'), 'templatefx');
    assert.equal(aa.standardizeTrigger('melee-target'), 'melee');
    assert.equal(aa.standardizeTrigger('ranged-target'), 'range');
    assert.equal(aa.standardizeTrigger('effect'), 'aefx');
    assert.equal(aa.standardizeTrigger('aura'), 'aura');

    const entry = aa.createAutorecEntry('magicMissile', 'range', 'eskie.effect.magicMissile', { speed: 2 }, '1.0.0', 'Magic Missile');
    assert.ok(entry);
    assert.equal(entry.label, 'Magic Missile');
    assert.equal(entry.metaData.name, 'Eskie Macro Pack');
    assert.equal(entry.metaData.version, '1.0.0');
    assert.ok(entry.macro.args.includes('eskie.effect.magicMissile'));
});

test('BlfxModuleAdapter standardizes triggers and generates compliant macro commands', () => {
    const blfx = new BlfxModuleAdapter();
    assert.equal(blfx.standardizeTrigger('melee-target'), 'afterAttack');
    assert.equal(blfx.standardizeTrigger('template'), 'createTemplate');
    assert.equal(blfx.standardizeTrigger('effect'), 'afterActiveEffects');
    assert.equal(blfx.standardizeTrigger('token'), 'afterItemUse');
    assert.equal(blfx.standardizeTrigger('template', 'templatePlaced'), 'templatePlaced');

    const commandTargeted = blfx.buildMacroCommand('eskie.effect.sneakAttack', 'melee-target', { damage: '2d6' });
    assert.ok(commandTargeted.includes('Eskie Macro Pack Autorec (Targeted)'));
    assert.ok(commandTargeted.includes('eskie.effect.sneakAttack'));

    const commandAe = blfx.buildMacroCommand('eskie.effect.rage', 'effect', { color: 'red' });
    assert.ok(commandAe.includes('Eskie Macro Pack Autorec (On Target or Token - AE)'));
    assert.ok(commandAe.includes('activeEffect'));

    const commandSelf = blfx.buildMacroCommand('eskie.effect.shield', 'token', {});
    assert.ok(commandSelf.includes('Eskie Macro Pack Autorec'));
    assert.ok(commandSelf.includes('eskie.effect.shield'));
});

test('SocketlibModuleAdapter registers RPC handlers cleanly', async () => {
    const registeredSockets = new Map();
    globalThis.socketlib = {
        registerModule: (modId) => ({
            register: (name, fn) => registeredSockets.set(name, fn)
        })
    };

    const sockAdapter = new SocketlibModuleAdapter();
    await sockAdapter.register();

    assert.ok(registeredSockets.has('createTile'));
    assert.ok(registeredSockets.has('destroyTiles'));
    assert.ok(registeredSockets.has('editDoor'));
    assert.ok(registeredSockets.has('editToken'));
    assert.ok(registeredSockets.has('playTokenMaskLocal'));
});

test('AutorecManager coordinates registration across AA and BLFX adapters', () => {
    const customAA = new AutoanimationsModuleAdapter();
    const customBLFX = new BlfxModuleAdapter();
    const manager = new AutorecManager(customAA, customBLFX);

    manager.register('fireball', 'template', 'eskie.effect.fireball', { radius: 20 }, '1.0.0', 'Fireball');

    assert.equal(customAA.menu.templatefx.length, 1);
    assert.equal(customAA.menu.templatefx[0].label, 'Fireball');
    assert.ok(customBLFX.registry.dnd5e.fireball.default.createTemplate);
    assert.equal(customBLFX.registry.dnd5e.fireball.default.createTemplate.itemName, 'Fireball');
});

test('AutorecManager MELEE and RANGED helpers format prefixed keys for dual attack registration', () => {
    const customAA = new AutoanimationsModuleAdapter();
    const customBLFX = new BlfxModuleAdapter();
    const manager = new AutorecManager(customAA, customBLFX);

    const meleeKey = manager.MELEE('dagger', 'Dagger');
    const rangedKey = manager.RANGED('dagger', 'Dagger');

    assert.equal(meleeKey, '(Melee) Dagger');
    assert.equal(rangedKey, '(Ranged) Dagger');

    manager.register(meleeKey, 'melee-target', 'eskie.effect.daggerMelee', {}, '1.0.0', meleeKey);
    manager.register(rangedKey, 'ranged-target', 'eskie.effect.daggerThrown', {}, '1.0.0', rangedKey);

    assert.equal(customAA.menu.melee.length, 1);
    assert.equal(customAA.menu.melee[0].label, '(Melee) Dagger');
    assert.equal(customAA.menu.range.length, 1);
    assert.equal(customAA.menu.range[0].label, '(Ranged) Dagger');

    assert.ok(customBLFX.registry.dnd5e['melee-dagger'].default.afterAttack);
    assert.ok(customBLFX.registry.dnd5e['ranged-dagger'].default.afterAttack);
});

test('MassEditModuleAdapter delegates link and removeLinks to MassEdit.linker', async () => {
    const linked = [];
    const unlinked = [];
    globalThis.MassEdit = {
        linker: {
            link: async (elements) => {
                linked.push(elements);
                return { linked: true };
            },
            removeLinks: async (elements) => {
                unlinked.push(elements);
                return { unlinked: true };
            }
        }
    };

    const massEdit = new MassEditModuleAdapter();
    const token = { id: 'tok-1', documentName: 'Token' };
    const tile1 = { id: 'tile-1', documentName: 'Tile' };
    const tile2 = { id: 'tile-2', documentName: 'Tile' };

    await massEdit.link([tile1, tile2], token);
    assert.equal(linked.length, 2);
    assert.deepEqual(linked[0], [tile1, token]);
    assert.deepEqual(linked[1], [tile2, token]);

    await massEdit.removeLinks([tile1, tile2], token);
    assert.equal(unlinked.length, 2);
    assert.deepEqual(unlinked[0], [tile1, token]);
    assert.deepEqual(unlinked[1], [tile2, token]);
});

test('TokenAttacherModuleAdapter delegates attach and detach to tokenAttacher global', async () => {
    let attachCalled = null;
    let detachCalled = null;

    globalThis.tokenAttacher = {
        attachElementsToToken: async (elements, target, suppress) => {
            attachCalled = { elements, target, suppress };
            return { attached: true };
        },
        detachElementsFromToken: async (elements, target, suppress) => {
            detachCalled = { elements, target, suppress };
            return { detached: true };
        }
    };

    const tokenAttacher = new TokenAttacherModuleAdapter();
    const token = { id: 'tok-1', documentName: 'Token' };
    const elements = [{ id: 'tile-1' }, { id: 'tile-2' }];

    await tokenAttacher.attach(elements, token, true);
    assert.ok(attachCalled);
    assert.equal(attachCalled.elements.length, 2);
    assert.equal(attachCalled.target.id, 'tok-1');
    assert.equal(attachCalled.suppress, true);

    await tokenAttacher.detach(elements, token, false);
    assert.ok(detachCalled);
    assert.equal(detachCalled.elements.length, 2);
    assert.equal(detachCalled.target.id, 'tok-1');
    assert.equal(detachCalled.suppress, false);
});

test('Unified Adapter delegates to module adapters through accessors', async () => {
    game.modules = new Map([
        ['autoanimations', { id: 'autoanimations', active: true }],
        ['blfx', { id: 'blfx', active: true }],
        ['socketlib', { id: 'socketlib', active: true }],
        ['midi-qol', { id: 'midi-qol', active: true }],
        ['multi-token-edit', { id: 'multi-token-edit', active: true }],
        ['token-attacher', { id: 'token-attacher', active: true }]
    ]);

    await adapter.init();

    assert.ok(adapter.autoanimations instanceof AutoanimationsModuleAdapter);
    assert.ok(adapter.blfx instanceof BlfxModuleAdapter);
    assert.ok(adapter.socketlib instanceof SocketlibModuleAdapter);
    assert.ok(adapter.midiQol instanceof MidiQolModuleAdapter);
    assert.ok(adapter.autorec instanceof AutorecManager);
    assert.ok(adapter.massEdit instanceof MassEditModuleAdapter);
    assert.ok(adapter.tokenAttacher instanceof TokenAttacherModuleAdapter);
    assert.equal(adapter.hasModule('autoanimations'), true);
    assert.equal(adapter.hasModule('multi-token-edit'), true);
    assert.equal(adapter.hasModule('token-attacher'), true);
    assert.equal(adapter.hasModule('non-existent'), false);
});
