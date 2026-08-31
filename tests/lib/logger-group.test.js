import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { MODULE_TLA } from '../../src/lib/constants.js';
import { log, GROUP_STYLES } from '../../src/lib/logger.js';

test('GROUP_STYLES provides distinct highlights per verbosity level', () => {
    assert.ok(GROUP_STYLES.error.includes('#ef4444'));
    assert.ok(GROUP_STYLES.warn.includes('#f59e0b'));
    assert.ok(GROUP_STYLES.info.includes('#ffffff'));
    assert.ok(GROUP_STYLES.debug.includes('#38bdf8'));
});

test('log.group and log.groupEnd respect verbosity levels and lazily open groups on first log execution', () => {
    const groups = [];
    const origGroup = console.group;
    const origGroupCollapsed = console.groupCollapsed;
    const origGroupEnd = console.groupEnd;

    console.group = (...args) => groups.push({ type: 'start', args });
    console.groupCollapsed = (...args) => groups.push({ type: 'start', args });
    console.groupEnd = () => groups.push({ type: 'end' });

    try {
        // 1. When verbosity is 'warn', 'debug' group is suppressed even if debug message is called
        log.setVerbosity('warn');
        log.group('Suppressed debug group', 'debug');
        log.debug('Debug message while warn verbosity');
        log.groupEnd();
        assert.equal(groups.length, 0, 'Debug groups should not trigger console.group when verbosity is warn');

        // 2. When verbosity is 'debug', 'debug' group is logged IF a debug message executes
        log.setVerbosity('debug');
        log.group('Active debug group', 'debug');
        log.debug('Active debug message');
        log.groupEnd();
        assert.equal(groups.length, 2, 'Debug group should trigger console.group and console.groupEnd when debug message executes');
        assert.equal(groups[0].type, 'start');
        assert.ok(groups[0].args[0].includes('Active debug group'));
        assert.ok(groups[0].args[1].includes('#38bdf8'), 'Debug group should have teal highlight');
        assert.equal(groups[1].type, 'end');

        // 3. When verbosity is 'debug' but NO log message executes, group is NOT started (no empty groups)
        groups.length = 0;
        log.group('Empty debug group', 'debug');
        log.groupEnd();
        assert.equal(groups.length, 0, 'Empty debug group with no logs must not trigger console.group');
    } finally {
        console.group = origGroup;
        console.groupCollapsed = origGroupCollapsed;
        console.groupEnd = origGroupEnd;
        log.setVerbosity('debug');
    }
});

test('log.group, log.groupCollapsed, and log.groupExpanded apply correct collapse defaults and styles', () => {
    const groups = [];
    const origGroup = console.group;
    const origGroupCollapsed = console.groupCollapsed;
    const origGroupEnd = console.groupEnd;

    console.group = (...args) => groups.push({ type: 'group', args });
    console.groupCollapsed = (...args) => groups.push({ type: 'collapsed', args });
    console.groupEnd = () => groups.push({ type: 'end' });

    log.setVerbosity('debug');

    try {
        // Error: red (#ef4444), starts out expanded
        log.group('Error group', 'error');
        log.error('Error occurred');
        log.groupEnd();
        assert.equal(groups[0].type, 'group', 'Error group should start out expanded');
        assert.ok(groups[0].args[0].includes(`${MODULE_TLA} | Error group`));
        assert.ok(groups[0].args[1].includes('#ef4444'), 'Error group should have red highlight');

        // Warn: yellow-orange (#f59e0b), starts out expanded
        log.group('Warn group', 'warn');
        log.warn('Warning occurred');
        log.groupEnd();
        assert.equal(groups[2].type, 'group', 'Warn group should start out expanded');
        assert.ok(groups[2].args[0].includes(`${MODULE_TLA} | Warn group`));
        assert.ok(groups[2].args[1].includes('#f59e0b'), 'Warn group should have yellow-orange highlight');

        // Info: white (#ffffff), starts out collapsed
        log.group('Info group', 'info');
        log.info('Info occurred');
        log.groupEnd();
        assert.equal(groups[4].type, 'collapsed', 'Info group should start out collapsed');
        assert.ok(groups[4].args[0].includes(`${MODULE_TLA} | Info group`));
        assert.ok(groups[4].args[1].includes('#ffffff'), 'Info group should have white highlight');

        // Default level (no level arg): info (#ffffff), starts out collapsed
        log.group('Default group');
        log.info('Default message');
        log.groupEnd();
        assert.equal(groups[6].type, 'collapsed', 'Default group should default to collapsed');
        assert.ok(groups[6].args[0].includes(`${MODULE_TLA} | Default group`));
        assert.ok(groups[6].args[1].includes('#ffffff'), 'Default group should default to white highlight');

        // Debug: teal (#38bdf8), starts out collapsed
        log.group('Debug group', 'debug');
        log.debug('Debug occurred');
        log.groupEnd();
        assert.equal(groups[8].type, 'collapsed', 'Debug group should start out collapsed');
        assert.ok(groups[8].args[0].includes(`${MODULE_TLA} | Debug group`));
        assert.ok(groups[8].args[1].includes('#38bdf8'), 'Debug group should have teal highlight');

        // Collapsed group: triggers console.groupCollapsed with styling
        log.groupCollapsed('Explicit collapsed group', 'warn');
        log.warn('Warn occurred in collapsed');
        log.groupEnd();
        assert.equal(groups[10].type, 'collapsed');
        assert.ok(groups[10].args[0].includes(`${MODULE_TLA} | Explicit collapsed group`));
        assert.ok(groups[10].args[1].includes('#f59e0b'), 'Explicit collapsed warn group should have yellow-orange highlight');

        // Expanded group: triggers console.group with styling
        log.groupExpanded('Explicit expanded debug group', 'debug');
        log.debug('Debug occurred in expanded');
        log.groupEnd();
        assert.equal(groups[12].type, 'group', 'groupExpanded should force expanded group');
        assert.ok(groups[12].args[0].includes(`${MODULE_TLA} | Explicit expanded debug group`));
        assert.ok(groups[12].args[1].includes('#38bdf8'), 'Explicit expanded debug group should have teal highlight');
    } finally {
        console.group = origGroup;
        console.groupCollapsed = origGroupCollapsed;
        console.groupEnd = origGroupEnd;
        log.setVerbosity('debug');
    }
});
