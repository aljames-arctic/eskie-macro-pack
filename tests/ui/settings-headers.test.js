import test from 'node:test';
import assert from 'node:assert/strict';
import '../setup.js';
import { injectSettingsHeaders } from '../../src/settings.js';
import { MODULE_ID } from '../../src/lib/constants.js';

class MockElement {
    constructor(tagName, attrs = {}) {
        this.tagName = tagName;
        this.className = attrs.className ?? '';
        this.dataset = attrs.dataset ?? {};
        this.name = attrs.name ?? '';
        this.children = [];
        this.parentNode = null;
        this.previousElementSibling = null;
        this.innerHTML = '';
        this.classList = {
            contains: (cls) => this.className.split(' ').includes(cls),
            add: (cls) => { if (!this.classList.contains(cls)) this.className = `${this.className} ${cls}`.trim(); }
        };
    }

    get firstElementChild() {
        return this.children[0] ?? null;
    }

    appendChild(child) {
        if (child.parentNode) {
            const oldIdx = child.parentNode.children.indexOf(child);
            if (oldIdx !== -1) child.parentNode.children.splice(oldIdx, 1);
        }
        if (this.children.length > 0) {
            child.previousElementSibling = this.children[this.children.length - 1];
        } else {
            child.previousElementSibling = null;
        }
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    insertBefore(newChild, refChild) {
        if (newChild.parentNode) {
            const oldIdx = newChild.parentNode.children.indexOf(newChild);
            if (oldIdx !== -1) newChild.parentNode.children.splice(oldIdx, 1);
        }
        const index = refChild ? this.children.indexOf(refChild) : -1;
        if (index === -1) {
            return this.appendChild(newChild);
        }
        newChild.parentNode = this;
        const prev = refChild.previousElementSibling;
        newChild.previousElementSibling = prev;
        refChild.previousElementSibling = newChild;
        this.children.splice(index, 0, newChild);
        return newChild;
    }

    closest(selector) {
        if (selector === '.form-group') {
            let curr = this;
            while (curr) {
                if (curr.classList?.contains('form-group')) return curr;
                curr = curr.parentNode;
            }
        }
        return null;
    }

    querySelector(selector) {
        const parts = selector.split(',').map(s => s.trim());
        const findMatch = (el) => {
            for (const part of parts) {
                if (part.startsWith('[name="') && part.endsWith('"]')) {
                    const expectedName = part.slice(7, -2);
                    if (el.name === expectedName) return el;
                }
                if (part.startsWith('[data-setting-id="') && part.endsWith('"]')) {
                    const expectedId = part.slice(18, -2);
                    if (el.dataset?.settingId === expectedId) return el;
                }
                if (part.startsWith('[data-key="') && part.endsWith('"]')) {
                    const expectedKey = part.slice(11, -2);
                    if (el.dataset?.key === expectedKey) return el;
                }
                if (part.includes('[data-scope="') && part.endsWith('"]')) {
                    const expectedScope = part.split('[data-scope="')[1].slice(0, -2);
                    if (el.dataset?.scope === expectedScope) return el;
                }
            }
            for (const child of el.children) {
                const found = findMatch(child);
                if (found) return found;
            }
            return null;
        };
        return findMatch(this);
    }
}

if (!globalThis.document) {
    globalThis.document = {
        createElement: (tagName) => new MockElement(tagName)
    };
}

test('injectSettingsHeaders inserts world and client headers into EMP SettingsConfig DOM', () => {
    const origCreateElement = globalThis.document.createElement;
    globalThis.document.createElement = (tagName) => new MockElement(tagName);

    try {
        const root = new MockElement('div', { className: 'settings-list' });

        // World group (generateCompendiums menu button at top)
        const fgWorld = new MockElement('div', { className: 'form-group' });
        const btnWorld = new MockElement('button', { dataset: { key: `${MODULE_ID}.generateCompendiums` } });
        fgWorld.appendChild(btnWorld);
        root.appendChild(fgWorld);

        // World group (recommendedModules menu button)
        const fgRec = new MockElement('div', { className: 'form-group' });
        const btnRec = new MockElement('button', { dataset: { key: `${MODULE_ID}.recommendedModules` } });
        fgRec.appendChild(btnRec);
        root.appendChild(fgRec);

        // Client group (logVerbosity)
        const fgClient = new MockElement('div', { className: 'form-group' });
        const inputClient = new MockElement('input', { name: `${MODULE_ID}.logVerbosity` });
        fgClient.appendChild(inputClient);
        root.appendChild(fgClient);

        // First injection
        injectSettingsHeaders(root);

        assert.equal(root.children.length, 5, 'Should have 2 headers (world, client) and 3 form groups (total 5)');
        assert.equal(root.children[0].className, 'emp-settings-section-header');
        assert.equal(root.children[0].dataset.scope, 'world');
        assert.equal(root.children[1], fgWorld);
        assert.equal(root.children[2], fgRec);

        assert.equal(root.children[3].className, 'emp-settings-section-header');
        assert.equal(root.children[3].dataset.scope, 'client');
        assert.equal(root.children[4], fgClient);

        // Second injection (idempotency check)
        injectSettingsHeaders(root);
        assert.equal(root.children.length, 5, 'Should remain 5 items without duplicate headers');
    } finally {
        globalThis.document.createElement = origCreateElement;
    }
});

test('injectSettingsHeaders positions generateCompendiums at the very top of World Settings', () => {
    const origCreateElement = globalThis.document.createElement;
    globalThis.document.createElement = (tagName) => new MockElement(tagName);

    try {
        const root = new MockElement('div', { className: 'settings-list' });

        // In Foundry, menus are registered in arbitrary order; suppose recommendedModules was rendered first
        const fgRecMenu = new MockElement('div', { className: 'form-group' });
        const btnRec = new MockElement('button', { dataset: { key: `${MODULE_ID}.recommendedModules` } });
        fgRecMenu.appendChild(btnRec);
        root.appendChild(fgRecMenu);

        const fgAutorecMenu = new MockElement('div', { className: 'form-group' });
        const btnAutorec = new MockElement('button', { dataset: { key: `${MODULE_ID}.configureAutorec` } });
        fgAutorecMenu.appendChild(btnAutorec);
        root.appendChild(fgAutorecMenu);

        const fgWorldScriptsMenu = new MockElement('div', { className: 'form-group' });
        const btnWorldScripts = new MockElement('button', { dataset: { key: `${MODULE_ID}.worldScripts` } });
        fgWorldScriptsMenu.appendChild(btnWorldScripts);
        root.appendChild(fgWorldScriptsMenu);

        // World setting
        const fgSounds = new MockElement('div', { className: 'form-group' });
        const inputSounds = new MockElement('input', { name: `${MODULE_ID}.enableSounds` });
        fgSounds.appendChild(inputSounds);
        root.appendChild(fgSounds);

        // generateCompendiums menu button (registered further down)
        const fgGenComp = new MockElement('div', { className: 'form-group' });
        const btnGenComp = new MockElement('button', { dataset: { key: `${MODULE_ID}.generateCompendiums` } });
        fgGenComp.appendChild(btnGenComp);
        root.appendChild(fgGenComp);

        // Client setting
        const fgLog = new MockElement('div', { className: 'form-group' });
        const inputLog = new MockElement('input', { name: `${MODULE_ID}.logVerbosity` });
        fgLog.appendChild(inputLog);
        root.appendChild(fgLog);

        injectSettingsHeaders(root);

        // Expected DOM structure:
        // [0]: World Header
        // [1]: fgGenComp (generateCompendiums elevated to very top!)
        // [2]: fgRecMenu (recommendedModules / View Companion Modules in World Settings)
        // [3]: fgAutorecMenu (World Menu)
        // [4]: fgWorldScriptsMenu (World Menu)
        // [5]: fgSounds (World Setting)
        // [6]: Client Header
        // [7]: fgLog (Client Setting)
        assert.equal(root.children.length, 8);
        assert.equal(root.children[0].className, 'emp-settings-section-header');
        assert.equal(root.children[0].dataset.scope, 'world');
        assert.equal(root.children[1], fgGenComp, 'generateCompendiums should be at the very top of World Settings');
        assert.equal(root.children[2], fgRecMenu, 'recommendedModules should be in World Settings');
        assert.equal(root.children[3], fgAutorecMenu);
        assert.equal(root.children[4], fgWorldScriptsMenu);
        assert.equal(root.children[5], fgSounds);

        assert.equal(root.children[6].className, 'emp-settings-section-header');
        assert.equal(root.children[6].dataset.scope, 'client');
        assert.equal(root.children[7], fgLog);
    } finally {
        globalThis.document.createElement = origCreateElement;
    }
});
