import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { rollTracker } from '../../src/world-scripts/rollAnimation.js';

test('rollTracker.getMessageVisibilityUsers correctly delegates to adapter', () => {
    const gm = { id: 'gm-user', isGM: true };
    const p1 = { id: 'player-1', isGM: false };
    const p2 = { id: 'player-2', isGM: false };

    globalThis.game = {
        ...globalThis.game,
        users: [gm, p1, p2]
    };

    const publicMsg = { whisper: [], author: { id: 'player-1' } };
    assert.deepEqual(rollTracker.getMessageVisibilityUsers(publicMsg), ['gm-user', 'player-1', 'player-2']);

    const whisperMsg = { whisper: ['player-2'], author: { id: 'player-1' } };
    const whisperUsers = rollTracker.getMessageVisibilityUsers(whisperMsg);
    assert.ok(whisperUsers.includes('player-1'));
    assert.ok(whisperUsers.includes('player-2'));
    assert.ok(whisperUsers.includes('gm-user'));
});

test('rollTracker.processMessageAndPlay only executes on rolling user machine and passes visibility-restricted users to sequence effects', async () => {
    const gm = { id: 'gm-user', isGM: true };
    const p1 = { id: 'player-1', isGM: false };
    const p2 = { id: 'player-2', isGM: false };

    globalThis.game = {
        ...globalThis.game,
        user: p1,
        users: [gm, p1, p2]
    };
    globalThis.game.modules.set('eskie-effects', { id: 'eskie-effects', active: true });

    // Track Sequence method calls
    const sequenceCalls = [];
    const effectCalls = [];

    const mockEffectProxy = new Proxy({}, {
        get(_t, prop) {
            return (...args) => {
                effectCalls.push({ method: prop, args });
                return mockEffectProxy;
            };
        }
    });

    const mockSequenceProxy = new Proxy({}, {
        get(_t, prop) {
            if (prop === 'effect') {
                return (...args) => {
                    sequenceCalls.push({ method: 'effect', args });
                    return mockEffectProxy;
                };
            }
            if (prop === 'play') {
                return (...args) => {
                    sequenceCalls.push({ method: 'play', args });
                    return Promise.resolve();
                };
            }
            return (...args) => {
                sequenceCalls.push({ method: prop, args });
                return mockSequenceProxy;
            };
        }
    });

    const originalSequence = globalThis.Sequence;
    globalThis.Sequence = function() {
        return mockSequenceProxy;
    };

    try {
        const mockToken = {
            id: 'tok-1',
            name: 'Hero',
            h: 100,
            document: { id: 'tok-1', name: 'Hero' }
        };

        globalThis.canvas = {
            ready: true,
            tokens: {
                get: (id) => id === 'tok-1' ? mockToken : null,
                controlled: [mockToken]
            }
        };

        const flags = {};
        const mockMessage = {
            id: 'msg-123',
            whisper: ['player-2'],
            author: { id: 'player-1' },
            flavor: 'Strength Saving Throw',
            content: 'Roll: 18 (Success)',
            flags: {
                world: flags,
                dnd5e: {
                    roll: {
                        type: 'save',
                        ability: 'str'
                    }
                }
            },
            speaker: { token: 'tok-1' },
            setFlag: async (_scope, key, value) => {
                flags[key] = value;
            }
        };

        // 1. If another user (not the message creator) runs the hook, do not start sequence
        await rollTracker.processMessageAndPlay(mockMessage, 'some-other-user');
        assert.equal(sequenceCalls.length, 0, 'Must ignore non-rolling user execution');

        // 2. Rolling user runs the hook
        await rollTracker.processMessageAndPlay(mockMessage, 'player-1');

        // Verify sequence and effect calls
        assert.ok(sequenceCalls.some(c => c.method === 'effect'), 'Sequence.effect() must be invoked');
        assert.ok(sequenceCalls.some(c => c.method === 'play' && c.args[0]?.remote === true), 'Sequence.play({ remote: true }) must be called');

        // Verify forUsers was called with visibility-restricted users (author, target player, GM)
        const forUsersCalls = effectCalls.filter(c => c.method === 'forUsers');
        assert.ok(forUsersCalls.length >= 2, 'forUsers must be called on both rollEffect and smokeEffect');
        const passedUsers = forUsersCalls[0].args[0];
        assert.ok(passedUsers.includes('player-1'), 'Author must be in forUsers');
        assert.ok(passedUsers.includes('player-2'), 'Whisper target must be in forUsers');
        assert.ok(passedUsers.includes('gm-user'), 'GM must be in forUsers');

        // Verify message flag was saved to prevent duplicate execution
        assert.deepEqual(flags.rollAnimatedTokens, ['tok-1']);

        // 3. Second call with same message & token does not re-trigger
        const callsBefore = sequenceCalls.length;
        await rollTracker.processMessageAndPlay(mockMessage, 'player-1');
        assert.equal(sequenceCalls.length, callsBefore, 'Duplicate execution on same token must be ignored');

        // 4. Public roll test: passes all game.users to forUsers
        effectCalls.length = 0;
        sequenceCalls.length = 0;
        const publicFlags = {};
        const publicMessage = {
            id: 'msg-456',
            whisper: [],
            author: { id: 'player-1' },
            flavor: 'Strength Saving Throw',
            content: 'Roll: 20 (Success)',
            flags: {
                world: publicFlags,
                dnd5e: {
                    roll: {
                        type: 'save',
                        ability: 'str'
                    }
                }
            },
            speaker: { token: 'tok-1' },
            setFlag: async (_scope, key, value) => {
                publicFlags[key] = value;
            }
        };

        await rollTracker.processMessageAndPlay(publicMessage, 'player-1');
        const publicForUsersCalls = effectCalls.filter(c => c.method === 'forUsers');
        assert.ok(publicForUsersCalls.length >= 2, 'forUsers must be called on public roll effects');
        const publicUsers = publicForUsersCalls[0].args[0];
        assert.deepEqual(publicUsers.sort(), ['gm-user', 'player-1', 'player-2'].sort(), 'All world users must be permitted on public roll');
    } finally {
        globalThis.game.modules.delete('eskie-effects');
        globalThis.Sequence = originalSequence;
    }
});
