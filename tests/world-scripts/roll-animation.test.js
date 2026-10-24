import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { rollTracker } from '../../src/world-scripts/rollAnimation.js';

test('rollTracker.getMessageVisibilityUsers correctly delegates to adapter for all roll modes', () => {
    const gm = { id: 'gm-user', isGM: true };
    const p1 = { id: 'player-1', isGM: false };
    const p2 = { id: 'player-2', isGM: false };

    globalThis.game = {
        ...globalThis.game,
        users: [gm, p1, p2]
    };

    // Public roll (Public as User / Public as Character)
    const publicMsg = { whisper: [], author: { id: 'player-1' } };
    assert.deepEqual(rollTracker.getMessageVisibilityUsers(publicMsg), ['gm-user', 'player-1', 'player-2']);

    // Private to Gamemasters
    const gmWhisperMsg = { whisper: ['gm-user'], blind: false, author: { id: 'player-1' } };
    const gmWhisperUsers = rollTracker.getMessageVisibilityUsers(gmWhisperMsg);
    assert.ok(gmWhisperUsers.includes('player-1'), 'Author sees roll');
    assert.ok(gmWhisperUsers.includes('gm-user'), 'GM sees roll');
    assert.equal(gmWhisperUsers.includes('player-2'), false, 'Other player does not see roll');

    // Blind to Gamemasters
    const blindMsg = { whisper: ['gm-user'], blind: true, author: { id: 'player-1' } };
    const blindUsers = rollTracker.getMessageVisibilityUsers(blindMsg);
    assert.ok(blindUsers.includes('gm-user'), 'GM sees blind roll');
    assert.equal(blindUsers.includes('player-1'), false, 'Rolling player does not see blind roll');
    assert.equal(blindUsers.includes('player-2'), false, 'Other player does not see blind roll');

    // Self Only
    const selfMsg = { whisper: ['player-1'], blind: false, author: { id: 'player-1' } };
    const selfUsers = rollTracker.getMessageVisibilityUsers(selfMsg);
    assert.ok(selfUsers.includes('player-1'), 'Author sees self roll');
    assert.equal(selfUsers.includes('gm-user'), false, 'GM does not see self roll');
    assert.equal(selfUsers.includes('player-2'), false, 'Other player does not see self roll');
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
            whisper: ['gm-user'],
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

        // 2. Rolling user runs the hook (Private to Gamemasters)
        await rollTracker.processMessageAndPlay(mockMessage, 'player-1');

        // Verify sequence and effect calls
        assert.ok(sequenceCalls.some(c => c.method === 'effect'), 'Sequence.effect() must be invoked');
        assert.ok(sequenceCalls.some(c => c.method === 'play'), 'Sequence.play() must be called');

        // Verify forUsers was called with visibility-restricted users (author, GM)
        const forUsersCalls = effectCalls.filter(c => c.method === 'forUsers');
        assert.ok(forUsersCalls.length >= 2, 'forUsers must be called on both rollEffect and smokeEffect');
        const passedUsers = forUsersCalls[0].args[0];
        assert.ok(passedUsers.includes('player-1'), 'Author must be in forUsers');
        assert.ok(passedUsers.includes('gm-user'), 'GM must be in forUsers');
        assert.equal(passedUsers.includes('player-2'), false, 'Uninvolved player must NOT be in forUsers');

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

        // 5. Blind to Gamemasters test: restricts forUsers strictly to GMs (excluding rolling player)
        effectCalls.length = 0;
        sequenceCalls.length = 0;
        const blindFlags = {};
        const blindMessage = {
            id: 'msg-blind-789',
            whisper: ['gm-user'],
            blind: true,
            author: { id: 'player-1' },
            flavor: 'Wisdom Saving Throw',
            content: 'Roll: 14 (Success)',
            flags: {
                world: blindFlags,
                dnd5e: {
                    roll: {
                        type: 'save',
                        ability: 'wis'
                    }
                }
            },
            speaker: { token: 'tok-1' },
            setFlag: async (_scope, key, value) => {
                blindFlags[key] = value;
            }
        };

        await rollTracker.processMessageAndPlay(blindMessage, 'player-1');
        const blindForUsersCalls = effectCalls.filter(c => c.method === 'forUsers');
        assert.ok(blindForUsersCalls.length >= 2, 'forUsers must be called on blind roll effects');
        const blindUsers = blindForUsersCalls[0].args[0];
        assert.ok(blindUsers.includes('gm-user'), 'GM must be in forUsers on blind roll');
        assert.equal(blindUsers.includes('player-1'), false, 'Rolling player must NOT be in forUsers on blind roll');
        assert.equal(blindUsers.includes('player-2'), false, 'Other player must NOT be in forUsers on blind roll');

        // 6. Self Only test: restricts forUsers strictly to author (excluding GM)
        effectCalls.length = 0;
        sequenceCalls.length = 0;
        const selfFlags = {};
        const selfMessage = {
            id: 'msg-self-999',
            whisper: ['player-1'],
            blind: false,
            author: { id: 'player-1' },
            flavor: 'Dexterity Saving Throw',
            content: 'Roll: 17 (Success)',
            flags: {
                world: selfFlags,
                dnd5e: {
                    roll: {
                        type: 'save',
                        ability: 'dex'
                    }
                }
            },
            speaker: { token: 'tok-1' },
            setFlag: async (_scope, key, value) => {
                selfFlags[key] = value;
            }
        };

        await rollTracker.processMessageAndPlay(selfMessage, 'player-1');
        const selfForUsersCalls = effectCalls.filter(c => c.method === 'forUsers');
        assert.ok(selfForUsersCalls.length >= 2, 'forUsers must be called on self roll effects');
        const selfUsers = selfForUsersCalls[0].args[0];
        assert.ok(selfUsers.includes('player-1'), 'Author must be in forUsers on self roll');
        assert.equal(selfUsers.includes('gm-user'), false, 'GM must NOT be in forUsers on self roll');
        assert.equal(selfUsers.includes('player-2'), false, 'Other player must NOT be in forUsers on self roll');
    } finally {
        globalThis.game.modules.delete('eskie-effects');
        globalThis.Sequence = originalSequence;
    }
});
