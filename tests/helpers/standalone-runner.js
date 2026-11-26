import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { installRecordingSequence, assertSequencer431MotionContracts, makeToken } from './motion-contract.js';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const MACROS_DIR = path.resolve(process.cwd(), 'src/standalone-macros');

/**
 * Executes a standalone macro file from src/standalone-macros/ inside a Foundry-like
 * async macro sandbox and captures all Sequence, EffectManager, MotionManager, and UI calls.
 */
export async function runStandaloneMacro(filename, options = {}) {
    const filePath = path.join(MACROS_DIR, filename);
    const source = fs.readFileSync(filePath, 'utf8');

    // Enforce standalone purity: no ES module imports/exports
    assert.equal(
        /^\s*(import|export)\s/m.test(source),
        false,
        `${filename}: standalone macro must not contain ES import/export statements`
    );

    const controlled = options.controlled ?? [makeToken('caster1', 100, 100)];
    const targets = options.targets ?? [makeToken('target1', 300, 100)];
    const activeEffects = options.activeEffects ?? [];
    const activeMotionCount = options.activeMotionCount ?? 0;
    const crosshairResult = options.crosshairResult ?? { x: 450, y: 150 };
    const crosshairResults = options.crosshairResults ?? null;
    const dialogResult = options.dialogResult ?? null;
    const hasTags = options.hasTags ?? false;

    const rec = installRecordingSequence();
    const effectEnds = [];
    const motionEnds = [];
    const notifications = [];
    let crosshairCallIdx = 0;

    const origSequencer = globalThis.Sequencer;
    const origCanvas = globalThis.canvas;
    const origGame = globalThis.game;
    const origUi = globalThis.ui;
    const origDialog = globalThis.Dialog;
    const origTagger = globalThis.Tagger;
    const origConst = globalThis.CONST;

    const mockTargets = new Set(targets);
    mockTargets.first = () => targets[0];

    globalThis.Sequencer = {
        ...origSequencer,
        EffectManager: {
            getEffects: (filter = {}) => {
                if (typeof activeEffects === 'function') return activeEffects(filter);
                return activeEffects;
            },
            endEffects: async (opts) => {
                effectEnds.push(opts);
            },
        },
        MotionManager: {
            endMotions: (target, opts) => {
                motionEnds.push({ target, opts });
                return typeof activeMotionCount === 'function' ? activeMotionCount(target, opts) : activeMotionCount;
            },
            endAllMotions: (opts) => {
                motionEnds.push({ target: null, opts });
                return 0;
            },
            getDisplacement: () => ({ deltaX: 0, deltaY: 0, deltaAngle: 0 }),
        },
        Crosshair: {
            show: async () => {
                if (crosshairResults) {
                    const next = crosshairResults[crosshairCallIdx++];
                    return next ?? { cancelled: true };
                }
                return crosshairResult;
            },
        },
        Preloader: {
            preloadForClients: async () => true,
        },
        Database: {
            getEntry: (p) => ({ file: p }),
            entryExists: () => true,
        },
    };

    const gridSize = options.gridSize ?? 100;
    globalThis.canvas = {
        grid: {
            size: gridSize,
            distance: 5,
            getCenterPoint: (pt) => ({
                x: Math.floor(pt.x / gridSize) * gridSize + gridSize / 2,
                y: Math.floor(pt.y / gridSize) * gridSize + gridSize / 2,
            }),
            getSnappedPoint: (pt) => ({
                x: Math.floor(pt.x / gridSize) * gridSize,
                y: Math.floor(pt.y / gridSize) * gridSize,
            }),
            measurePath: (pts) => {
                const a = pts[0];
                const b = pts[1] ?? a;
                return { distance: Math.hypot(b.x - a.x, b.y - a.y) / gridSize * 5 };
            },
        },
        dimensions: {
            size: gridSize,
            distance: 5,
            width: 2000,
            height: 2000,
            sceneRect: { x: 0, y: 0, width: 2000, height: 2000 },
        },
        scene: {
            width: 2000,
            height: 2000,
            background: { src: '', offsetX: 0, offsetY: 0 },
            grid: { size: gridSize, distance: 5 },
        },
        tokens: {
            controlled,
            placeables: [...controlled, ...targets],
        },
        animatePan: async () => {},
    };

    const modulesMap = new Map([
        ['sequencer', { id: 'sequencer', active: true }],
        ['jb2a_patreon', { id: 'jb2a_patreon', active: true }],
        ['eskie-effects', { id: 'eskie-effects', active: true }],
        ['psfx', { id: 'psfx', active: true }],
        ['tagger', { id: 'tagger', active: true }],
    ]);
    globalThis.game = {
        ...origGame,
        modules: modulesMap,
        user: {
            id: 'gm',
            isGM: true,
            color: { css: '#ffffff' },
            targets: mockTargets,
        },
    };

    globalThis.ui = {
        notifications: {
            info: (m) => notifications.push({ level: 'info', m }),
            warn: (m) => notifications.push({ level: 'warn', m }),
            error: (m) => notifications.push({ level: 'error', m }),
        },
    };

    globalThis.Dialog = {
        wait: async () => dialogResult,
    };

    globalThis.Tagger = {
        hasTags: () => hasTags,
        addTags: async () => {},
        removeTags: async () => {},
    };

    globalThis.CONST = {
        GRID_SNAPPING_MODES: { CENTER: 1, VERTEX: 2 },
    };

    try {
        const fn = new AsyncFunction(source);
        await fn();

        // Execute any synchronous/async thenDo callbacks if requested
        if (options.runThenDo) {
            const snapshot = [...rec.sequences];
            for (const seq of snapshot) {
                for (const sec of seq.sections) {
                    if (sec.type === 'thenDo' && typeof sec.initArgs[0] === 'function') {
                        await sec.initArgs[0]();
                    }
                }
            }
        }

        // Validate every recorded Sequence against Sequencer 4.3.1 motion contracts
        for (let i = 0; i < rec.sequences.length; i++) {
            assertSequencer431MotionContracts(rec.sequences[i], `${filename}#seq${i}`);
        }

        return {
            sequences: rec.sequences,
            effectEnds,
            motionEnds,
            notifications,
            controlled,
            targets,
        };
    } finally {
        rec.restore();
        globalThis.Sequencer = origSequencer;
        globalThis.canvas = origCanvas;
        globalThis.game = origGame;
        globalThis.ui = origUi;
        globalThis.Dialog = origDialog;
        globalThis.Tagger = origTagger;
        globalThis.CONST = origConst;
    }
}
