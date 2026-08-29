import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

test('all source files import cleanly with zero ReferenceError or SyntaxError', async () => {
    function getFiles(dir) {
        let files = [];
        for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, item.name);
            if (item.isDirectory()) {
                if (item.name !== 'standalone-macros') {
                    files = files.concat(getFiles(full));
                }
            } else if (item.name.endsWith('.js')) {
                files.push(full);
            }
        }
        return files;
    }

    const allFiles = getFiles('src');
    const failures = [];

    for (const file of allFiles) {
        try {
            await import(path.resolve(file));
        } catch (e) {
            failures.push({ file, error: e.message });
        }
    }

    assert.equal(failures.length, 0, `Failed to import files: ${JSON.stringify(failures, null, 2)}`);
});
