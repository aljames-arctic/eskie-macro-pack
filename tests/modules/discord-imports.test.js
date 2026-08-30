import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import { effect } from '../../src/animation/effects/index.js';
import { KNOWN_STANDALONE_MACROS } from '../../src/lib/standalone-macros.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

test('arcaneShot collection is properly exported on effect object', () => {
    assert.ok(effect.arcaneShot, 'eskie.effect.arcaneShot must exist');
    const expectedArrows = [
        'banishingArrow',
        'beguilingArrow',
        'burstingArrow',
        'enfeeblingArrow',
        'graspingArrow',
        'piercingArrow',
        'shadowArrow'
    ];

    for (const arrowName of expectedArrows) {
        const item = effect.arcaneShot[arrowName];
        assert.ok(item, `arcaneShot.${arrowName} must exist`);
        assert.equal(typeof item.create, 'function', `arcaneShot.${arrowName}.create must be a function`);
        assert.equal(typeof item.play, 'function', `arcaneShot.${arrowName}.play must be a function`);
        assert.equal(typeof item.stop, 'function', `arcaneShot.${arrowName}.stop must be a function`);
        assert.ok(item.default_config, `arcaneShot.${arrowName}.default_config must exist`);
        assert.ok(item.default_config.sound, `arcaneShot.${arrowName}.default_config.sound must exist`);
        assert.equal(typeof item.default_config.sound.enable, 'boolean', `arcaneShot.${arrowName}.default_config.sound.enable must be boolean`);
    }
});

test('battlemaster collection is properly exported on effect object under battlemaster and battleMaster alias', () => {
    assert.ok(effect.battlemaster, 'eskie.effect.battlemaster must exist');
    assert.equal(effect.battlemaster, effect.battleMaster, 'battleMaster alias must point to battlemaster');

    const expectedManeuvers = [
        'baitAndSwitch',
        'feintingAttack',
        'lungingAttack',
        'parry',
        'pushingAttack',
        'sweepingAttack',
        'tripAttack'
    ];

    for (const maneuverName of expectedManeuvers) {
        const item = effect.battlemaster[maneuverName];
        assert.ok(item, `battlemaster.${maneuverName} must exist`);
        assert.equal(typeof item.create, 'function', `battlemaster.${maneuverName}.create must be a function`);
        assert.equal(typeof item.play, 'function', `battlemaster.${maneuverName}.play must be a function`);
        assert.equal(typeof item.stop, 'function', `battlemaster.${maneuverName}.stop must be a function`);
        assert.ok(item.default_config, `battlemaster.${maneuverName}.default_config must exist`);
        assert.ok(item.default_config.sound, `battlemaster.${maneuverName}.default_config.sound must exist`);
        assert.equal(typeof item.default_config.sound.enable, 'boolean', `battlemaster.${maneuverName}.default_config.sound.enable must be boolean`);
    }
});

test('all imported spells exist on effect object with create, play, stop, and default_config', () => {
    const expectedSpells = [
        'burningHands',
        'cloudkill',
        'contagion',
        'fireball',
        'mirrorImage',
        'rayOfSickness',
        'scorchingRay',
        'shockingGrasp',
        'wallOfFire',
        'web'
    ];

    for (const spellName of expectedSpells) {
        const item = effect[spellName];
        assert.ok(item, `effect.${spellName} must exist`);
        assert.equal(typeof item.create, 'function', `effect.${spellName}.create must be a function`);
        assert.equal(typeof item.play, 'function', `effect.${spellName}.play must be a function`);
        assert.equal(typeof item.stop, 'function', `effect.${spellName}.stop must be a function`);
        assert.ok(item.default_config, `effect.${spellName}.default_config must exist`);
    }
});

test('mirrorImage maintains both v1 and v2 versions like rage', () => {
    const { mirrorImage } = effect;
    assert.ok(mirrorImage.v1, 'mirrorImage.v1 must exist');
    assert.equal(typeof mirrorImage.v1.create, 'function');
    assert.equal(typeof mirrorImage.v1.play, 'function');
    assert.equal(typeof mirrorImage.v1.stop, 'function');

    assert.ok(mirrorImage.v2, 'mirrorImage.v2 must exist');
    assert.equal(typeof mirrorImage.v2.create, 'function');
    assert.equal(typeof mirrorImage.v2.play, 'function');
    assert.equal(typeof mirrorImage.v2.stop, 'function');

    assert.ok(mirrorImage.default_config.config_v1, 'mirrorImage must have config_v1');
    assert.ok(mirrorImage.default_config.config_v2, 'mirrorImage must have config_v2');
});

test('standalone macros exist, have valid syntax, and are registered in KNOWN_STANDALONE_MACROS', () => {
    const macroFiles = [
        'bait-and-switch.js',
        'banishing-arrow.js',
        'beguiling-arrow.js',
        'burning-hands.js',
        'bursting-arrow.js',
        'cloudkill.js',
        'contagion.js',
        'enfeebling-arrow.js',
        'feinting-attack.js',
        'fireball.js',
        'grasping-arrow.js',
        'lunging-attack.js',
        'mirror-image.js',
        'parry.js',
        'piercing-arrow.js',
        'pushing-attack.js',
        'ray-of-sickness.js',
        'scorching-ray.js',
        'shadow-arrow.js',
        'shocking-grasp.js',
        'sweeping-attack.js',
        'trip-attack.js',
        'wall-of-fire.js',
        'web.js'
    ];

    const standaloneDir = path.join(rootDir, 'src/standalone-macros');

    for (const file of macroFiles) {
        const filePath = path.join(standaloneDir, file);
        assert.ok(fs.existsSync(filePath), `Standalone macro ${file} must exist`);
        const content = fs.readFileSync(filePath, 'utf8');
        assert.ok(content.length > 50, `Standalone macro ${file} must not be empty`);

        // Check syntax validity using vm.Script compilation
        // Wrapped in async function to support top-level await in Foundry macros
        assert.doesNotThrow(() => {
            new vm.Script(`(async () => {\n${content}\n})()`, { filename: file });
        }, `Syntax error in ${file}`);

        // Check inclusion in KNOWN_STANDALONE_MACROS
        assert.ok(KNOWN_STANDALONE_MACROS.includes(file), `${file} must be included in KNOWN_STANDALONE_MACROS`);
    }

    // Check that KNOWN_STANDALONE_MACROS is sorted alphabetically
    const sorted = [...KNOWN_STANDALONE_MACROS].sort((a, b) => a.localeCompare(b));
    assert.deepEqual(KNOWN_STANDALONE_MACROS, sorted, 'KNOWN_STANDALONE_MACROS must be in alphabetical order');
});

test('banishingArrow and enfeeblingArrow do not restore visibility or end effects inside create()', () => {
    const banishingModule = fs.readFileSync(path.join(rootDir, 'src/animation/effects/arcane-shot/banishing-arrow.js'), 'utf8');
    const banishingMacro = fs.readFileSync(path.join(rootDir, 'src/standalone-macros/banishing-arrow.js'), 'utf8');
    assert.doesNotMatch(banishingModule, /\.thenDo\s*\(\s*function\s*\(\s*\)\s*\{[\s\S]*?\.show\(\)/, 'banishingArrow module create() must not unhide target in thenDo');
    assert.doesNotMatch(banishingMacro, /\.thenDo\s*\(\s*function\s*\(\s*\)\s*\{[\s\S]*?\.show\(\)/, 'banishing-arrow macro must not unhide target in thenDo');

    const enfeeblingModule = fs.readFileSync(path.join(rootDir, 'src/animation/effects/arcane-shot/enfeebling-arrow.js'), 'utf8');
    const enfeeblingMacro = fs.readFileSync(path.join(rootDir, 'src/standalone-macros/enfeebling-arrow.js'), 'utf8');
    assert.doesNotMatch(enfeeblingModule, /\.thenDo\s*\(\s*function\s*\(\s*\)\s*\{[\s\S]*?endEffects/, 'enfeeblingArrow module create() must not prematurely end effects in thenDo');
    assert.doesNotMatch(enfeeblingMacro, /\.thenDo\s*\(\s*function\s*\(\s*\)\s*\{[\s\S]*?endEffects/, 'enfeebling-arrow macro must not prematurely end effects in thenDo');
});

test('all KNOWN_STANDALONE_MACROS match disk files 1:1', () => {
    const standaloneDir = path.join(rootDir, 'src/standalone-macros');
    const diskFiles = fs.readdirSync(standaloneDir).filter(f => f.endsWith('.js'));
    const knownSet = new Set(KNOWN_STANDALONE_MACROS);

    for (const diskFile of diskFiles) {
        assert.ok(knownSet.has(diskFile), `${diskFile} on disk must be in KNOWN_STANDALONE_MACROS`);
    }

    for (const knownFile of KNOWN_STANDALONE_MACROS) {
        const filePath = path.join(standaloneDir, knownFile);
        assert.ok(fs.existsSync(filePath), `Known macro ${knownFile} must exist on disk`);
    }
});

test('no animation effect module or standalone macro embeds Sequencer crosshairs or callbacks', () => {
    function getJsFiles(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
            const res = path.resolve(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...getJsFiles(res));
            } else if (entry.name.endsWith('.js')) {
                files.push(res);
            }
        }
        return files;
    }

    const effectFiles = getJsFiles(path.join(rootDir, 'src/animation/effects'));
    const macroFiles = getJsFiles(path.join(rootDir, 'src/standalone-macros'));
    const allFiles = [...effectFiles, ...macroFiles];

    for (const filePath of allFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relPath = path.relative(rootDir, filePath);
        assert.doesNotMatch(
            content,
            /\.crosshair\s*\(/,
            `${relPath} must not use .crosshair(); targeting reticles are handled exclusively by Bakana's Better Crosshairs`
        );
        assert.doesNotMatch(
            content,
            /Sequencer\.Crosshair\.CALLBACKS/,
            `${relPath} must not use Sequencer.Crosshair.CALLBACKS; targeting reticles are handled exclusively by Bakana's Better Crosshairs`
        );
    }
});

test('no animation effect module or standalone macro animates position on sprite instead of spriteContainer', () => {
    function getJsFiles(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
            const res = path.resolve(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...getJsFiles(res));
            } else if (entry.name.endsWith('.js')) {
                files.push(res);
            }
        }
        return files;
    }

    const effectFiles = getJsFiles(path.join(rootDir, 'src/animation/effects'));
    const macroFiles = getJsFiles(path.join(rootDir, 'src/standalone-macros'));
    const allFiles = [...effectFiles, ...macroFiles];

    for (const filePath of allFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relPath = path.relative(rootDir, filePath);
        assert.doesNotMatch(
            content,
            /\.animateProperty\s*\(\s*(['"])sprite\1\s*,\s*(['"])position\./,
            `${relPath} must animate position on 'spriteContainer' instead of 'sprite'`
        );
    }
});

