import '../setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import {
    updateMacroCompendiums,
    updateStandaloneMacroCompendium,
    updateAaIntegrationCompendium,
    KNOWN_AA_BOOTSTRAP_MACROS,
    KNOWN_STANDALONE_MACROS
} from '../../src/lib/standalone-macros.js';
import { MODULE_ID } from '../../src/lib/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

function createMockCompendium(packName) {
    const documents = new Map();
    return {
        collection: packName,
        metadata: { packageType: 'module', packageName: MODULE_ID },
        locked: true,
        _documents: documents,
        async configure(options) {
            if (typeof options.locked === 'boolean') this.locked = options.locked;
        },
        async getIndex() {
            return Array.from(documents.values()).map(doc => ({
                _id: doc._id,
                name: doc.name,
                flags: doc.flags
            }));
        },
        async getDocument(id) {
            return documents.get(id) ?? null;
        }
    };
}

test('all KNOWN_AA_BOOTSTRAP_MACROS exist on disk and match 1:1', () => {
    const compMacroDir = path.join(rootDir, 'compendium-macros');
    const diskFiles = fs.readdirSync(compMacroDir).filter(f => f.endsWith('.js'));
    const knownFiles = KNOWN_AA_BOOTSTRAP_MACROS.map(m => m.file);

    assert.equal(diskFiles.length, knownFiles.length, 'Disk compendium-macros count must match KNOWN_AA_BOOTSTRAP_MACROS');
    for (const diskFile of diskFiles) {
        assert.ok(knownFiles.includes(diskFile), `${diskFile} must be defined in KNOWN_AA_BOOTSTRAP_MACROS`);
        const content = fs.readFileSync(path.join(compMacroDir, diskFile), 'utf8');
        assert.ok(content.length > 20, `${diskFile} must not be empty`);

        // Check syntax validity using vm.Script compilation
        assert.doesNotThrow(() => {
            new vm.Script(`(async () => {\n${content}\n})()`, { filename: diskFile });
        }, `Syntax error in ${diskFile}`);
    }
});

test('updateAaIntegrationCompendium populates AA bootstrap macros into eskie-aa-integration pack', async () => {
    const packName = `${MODULE_ID}.eskie-aa-integration`;
    const mockPack = createMockCompendium(packName);
    globalThis.game.packs.set(packName, mockPack);

    // Mock fetch for local module file resolution
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
        const match = url.match(/compendium-macros\/(.+)$/);
        if (match) {
            const diskPath = path.join(rootDir, 'compendium-macros', match[1]);
            if (fs.existsSync(diskPath)) {
                const text = fs.readFileSync(diskPath, 'utf8');
                return {
                    ok: true,
                    status: 200,
                    text: async () => text
                };
            }
        }
        return { ok: false, status: 404 };
    };

    try {
        await updateAaIntegrationCompendium({ packName });

        const index = await mockPack.getIndex();
        assert.equal(index.length, 4, 'Should sync all 4 AA bootstrap macros');

        const names = index.map(i => i.name).sort();
        assert.deepEqual(names, ['AA | Effect', 'AA | Target', 'AA | Template', 'AA | Token']);

        for (const entry of index) {
            const doc = await mockPack.getDocument(entry._id);
            assert.ok(doc, `Document ${entry.name} should exist`);
            assert.ok(doc.command.length > 0, `Command for ${entry.name} should not be empty`);
            assert.equal(doc.flags[MODULE_ID]?.aaIntegration, true);
        }

        // Test updating an existing macro
        await updateAaIntegrationCompendium({ packName });
        const updatedIndex = await mockPack.getIndex();
        assert.equal(updatedIndex.length, 4, 'Should update in-place without creating duplicate entries');
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('updateMacroCompendiums synchronizes both standalone macros and AA bootstrap macros', async () => {
    const standalonePackName = `${MODULE_ID}.eskie-standalone-macros`;
    const aaPackName = `${MODULE_ID}.eskie-aa-integration`;

    const standalonePack = createMockCompendium(standalonePackName);
    const aaPack = createMockCompendium(aaPackName);

    globalThis.game.packs.set(standalonePackName, standalonePack);
    globalThis.game.packs.set(aaPackName, aaPack);

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
        if (url.includes('compendium-macros/')) {
            const match = url.match(/compendium-macros\/(.+)$/);
            const diskPath = path.join(rootDir, 'compendium-macros', match[1]);
            return {
                ok: true,
                status: 200,
                text: async () => fs.readFileSync(diskPath, 'utf8')
            };
        }
        if (url.includes('src/standalone-macros/')) {
            const match = url.match(/src\/standalone-macros\/(.+)$/);
            const diskPath = path.join(rootDir, 'src/standalone-macros', match[1]);
            return {
                ok: true,
                status: 200,
                text: async () => fs.readFileSync(diskPath, 'utf8')
            };
        }
        return { ok: false, status: 404 };
    };

    try {
        await updateMacroCompendiums();

        const aaIndex = await aaPack.getIndex();
        assert.equal(aaIndex.length, 4, 'AA pack should have 4 bootstrap macros');

        const standaloneIndex = await standalonePack.getIndex();
        assert.equal(standaloneIndex.length, KNOWN_STANDALONE_MACROS.length, 'Standalone pack should have all standalone macros');
    } finally {
        globalThis.fetch = originalFetch;
    }
});
