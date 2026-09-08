import { initializeFoundryAdapter, BaseFoundryAdapter } from './foundry/index.js';
import { initializeSystemAdapter, BaseSystemAdapter } from './system/index.js';
import { GenericSystemAdapter } from './system/generic-system-adapter.js';
import { initializeModuleAdapters, BaseModuleAdapter } from './modules/index.js';
import { autoanimationsAdapter } from './modules/autoanimations/autoanimations-module-adapter.js';
import { blfxAdapter } from './modules/blfx/blfx-module-adapter.js';
import { socketlibAdapter } from './modules/socketlib/socketlib-module-adapter.js';
import { midiQolAdapter } from './modules/midi-qol/midi-qol-module-adapter.js';
import { autorecManager } from './modules/autorec/autorec-module-adapter.js';
import { massEditAdapter } from './modules/mass-edit/mass-edit-module-adapter.js';
import { tokenAttacherAdapter } from './modules/token-attacher/token-attacher-module-adapter.js';
import { crosshair } from '../lib/crosshairs.js';
import { template } from '../lib/templates.js';
import { file } from '../lib/filemanager.js';
import { log } from '../lib/logger.js';

/**
 * Unified Adapter Singleton for Eskie Macro Pack.
 * Centralizes and abstracts Foundry platform generations (V12, V13, V14+), Game Systems, and Third-Party Modules.
 */
class Adapter {
    constructor() {
        this.foundry = new BaseFoundryAdapter(this);
        this.system = new GenericSystemAdapter(this.foundry);
        this.modules = new Map();
        this._initialized = false;
    }

    /**
     * Backward-compatible getter for active system adapter.
     * @type {BaseSystemAdapter}
     */
    get activeSystemAdapter() {
        return this.system;
    }

    set activeSystemAdapter(sys) {
        this.system = sys;
    }

    /**
     * Initialize all adapter layers (Foundry, System, Module).
     * @returns {Promise<void>}
     */
    async init() {
        this.foundry = initializeFoundryAdapter(this);
        this.system = await initializeSystemAdapter(game?.system?.id, this.foundry);
        this.modules = initializeModuleAdapters();
        this._initialized = true;
        const systemLabel = this.system.isSupported ? this.system.systemId : `${this.system.systemId} (unsupported)`;
        log.info(`Unified Adapter initialized [Foundry: v${this.foundry.generation}, System: ${systemLabel}, Modules: ${this.modules.size}]`);
    }

    /* -------------------------------------------- */
    /*  Module Adapter Layer Accessors              */
    /* -------------------------------------------- */

    /**
     * Retrieve a specific instantiated module adapter by module ID.
     * @param {string} moduleId Unique module identifier
     * @returns {BaseModuleAdapter|undefined}
     */
    getModule(moduleId) {
        return this.modules.get(moduleId);
    }

    /**
     * Check whether an active module adapter exists for a given module ID.
     * @param {string} moduleId Unique module identifier
     * @returns {boolean}
     */
    hasModule(moduleId) {
        return this.modules.has(moduleId);
    }

    /**
     * Property-based accessor for instantiated module adapters.
     * Supports bracket and dot notation: e.g. adapter.module['midi-qol'] or adapter.module.autoanimations.
     * @type {Record<string, BaseModuleAdapter>}
     */
    get module() {
        return new Proxy(this.modules, {
            get: (target, prop) => {
                if (typeof prop === 'string') {
                    if (prop in target && typeof target[prop] === 'function') {
                        return target[prop].bind(target);
                    }
                    return target.get(prop) ?? this[prop];
                }
                return Reflect.get(target, prop);
            }
        });
    }

    get autoanimations() {
        return this.modules.get('autoanimations') ?? autoanimationsAdapter;
    }

    get blfx() {
        return this.modules.get('blfx')
            ?? this.modules.get('boss-loot-assets-premium')
            ?? this.modules.get('boss-loot-assets-free')
            ?? blfxAdapter;
    }

    get socketlib() {
        return this.modules.get('socketlib') ?? socketlibAdapter;
    }

    get midiQol() {
        return this.modules.get('midi-qol') ?? midiQolAdapter;
    }

    get autorec() {
        return autorecManager;
    }

    get massEdit() {
        return this.modules.get('multi-token-edit')
            ?? this.modules.get('mass-edit')
            ?? massEditAdapter;
    }

    get tokenAttacher() {
        return this.modules.get('token-attacher') ?? tokenAttacherAdapter;
    }

    get crosshair() {
        return crosshair;
    }

    get template() {
        return template;
    }

    get file() {
        return file;
    }

    /* -------------------------------------------- */
    /*  Foundry Platform Delegates                  */
    /* -------------------------------------------- */

    get generation() {
        return this.foundry.generation;
    }

    isNewerVersion(a, b) {
        return this.foundry.isNewerVersion(a, b);
    }

    fromUuidSync(uuid, options = {}) {
        return this.foundry.fromUuidSync(uuid, options);
    }

    async fromUuid(uuid, options = {}) {
        return this.foundry.fromUuid(uuid, options);
    }

    mergeObject(original, other = {}, options = {}) {
        return this.foundry.mergeObject(original, other, options);
    }

    duplicate(obj) {
        return this.foundry.duplicate(obj);
    }

    deepClone(obj) {
        return this.foundry.deepClone(obj);
    }

    getProperty(obj, path) {
        return this.foundry.getProperty(obj, path);
    }

    setProperty(obj, path, value) {
        return this.foundry.setProperty(obj, path, value);
    }

    randomID(length = 16) {
        return this.foundry.randomID(length);
    }

    isEmpty(obj) {
        return this.foundry.isEmpty(obj);
    }

    isNewerVersion(a, b) {
        return this.foundry.isNewerVersion(a, b);
    }

    hasProperty(obj, path) {
        return this.foundry.hasProperty(obj, path);
    }

    slugify(text, options = {}) {
        return this.foundry.slugify(text, options);
    }

    diffObject(original, other, options = {}) {
        return this.foundry.diffObject(original, other, options);
    }

    flattenObject(obj, d = 0) {
        return this.foundry.flattenObject(obj, d);
    }

    expandObject(obj, d = 0) {
        return this.foundry.expandObject(obj, d);
    }

    debounce(fn, delay) {
        return this.foundry.debounce(fn, delay);
    }

    async enrichHTML(content, options = {}) {
        return this.foundry.enrichHTML(content, options);
    }

    getCombatantsByToken(combat, token) {
        return this.foundry.getCombatantsByToken(combat, token);
    }

    getCombatantByToken(combat, token) {
        return this.foundry.getCombatantByToken(combat, token);
    }

    getUserPermissionTier(user) {
        return this.foundry.getUserPermissionTier(user);
    }

    isUserDocumentOwner(user, doc) {
        return this.foundry.isUserDocumentOwner(user, doc);
    }

    isUserInCharge(token, user = game?.user) {
        return this.foundry.isUserInCharge(token, user);
    }

    /* -------------------------------------------- */
    /*  Tile & Placeable Geometric Operations       */
    /* -------------------------------------------- */

    getRevealOffset(object, scale = 1) {
        return this.foundry.getRevealOffset(object, scale);
    }

    getShapeOffset(object) {
        return this.foundry.getShapeOffset(object);
    }

    getTileOffset(object, type, scale = 1) {
        return this.foundry.getTileOffset(object, type, scale);
    }

    getTemplatePosition(template, config = {}) {
        return this.foundry.getTemplatePosition(template, config);
    }

    getCrosshairPosition(position, config = {}) {
        return this.foundry.getCrosshairPosition(position, config);
    }

    resolveDistinctPositions(positions, config = {}, template = null) {
        return this.foundry.resolveDistinctPositions(positions, config, template);
    }

    getSceneBackground(scene = canvas?.scene, level = null) {
        return this.foundry.getSceneBackground(scene, level);
    }

    getSceneDimensions(scene = canvas?.scene) {
        return this.foundry.getSceneDimensions(scene);
    }

    getGridSize(scene = canvas?.scene) {
        return this.foundry.getGridSize(scene);
    }

    getSceneCenter(scene = canvas?.scene) {
        return this.foundry.getSceneCenter(scene);
    }

    getCenter(target) {
        return this.foundry.getCenter(target);
    }

    getTokenDimensions(token) {
        return this.foundry.getTokenDimensions(token);
    }

    getTokenRotation(token) {
        return this.foundry.getTokenRotation(token);
    }

    getInterpolatedPoints(point1, point2, stepDistancePx = 100) {
        return this.foundry.getInterpolatedPoints(point1, point2, stepDistancePx);
    }

    getBestAdjacentLocation(token, target) {
        return this.foundry.getBestAdjacentLocation(token, target);
    }

    buttonDialog(buttonData, options = {}) {
        return this.foundry.buttonDialog(buttonData, options);
    }

    getDocumentName(target) {
        return this.foundry.getDocumentName(target);
    }

    isDocumentOfType(target, type) {
        return this.foundry.isDocumentOfType(target, type);
    }

    getPlaceable(id) {
        return this.foundry.getPlaceable(id);
    }

    async loadTemplates(paths) {
        return this.foundry.loadTemplates(paths);
    }

    getSpeakerToken(message, extractedTokenId = null) {
        return this.foundry.getSpeakerToken(message, extractedTokenId);
    }

    getSpeakerActor(message) {
        return this.foundry.getSpeakerActor(message);
    }

    getDistance(t1, t2) {
        return this.foundry.getDistance(t1, t2);
    }

    getNearestSquareCenter(token, target) {
        return this.foundry.getNearestSquareCenter(token, target);
    }

    getTokenOwners(token, config = {}) {
        return this.foundry.getTokenOwners(token, config);
    }

    getTileBounds(tile) {
        return this.foundry.getTileBounds(tile);
    }

    getTokensInTile(tile) {
        return this.foundry.getTokensInTile(tile);
    }

    attachPlaceableElements(elements, target) {
        return this.foundry.attachPlaceableElements(elements, target);
    }

    detachPlaceableElements(elements, target) {
        return this.foundry.detachPlaceableElements(elements, target);
    }

    formatDeletionUpdate(path, keyId) {
        return this.foundry.formatDeletionUpdate(path, keyId);
    }

    /* -------------------------------------------- */
    /*  System Layer Delegates                      */
    /* -------------------------------------------- */

    qualifyMessage(message) {
        return this.system.qualifyMessage(message);
    }

    extractRolls(message) {
        return this.system.extractRolls(message);
    }

    normalizeAbility(rawAbility, combinedText = "", customMap = {}) {
        return this.system.normalizeAbility(rawAbility, combinedText, customMap);
    }

    getSpellLevel(config = {}) {
        return this.system.getSpellLevel(config);
    }

    getCreatureType(actor) {
        return this.system.getCreatureType(actor);
    }
}

export const adapter = new Adapter();

export {
    Adapter,
    BaseFoundryAdapter,
    BaseSystemAdapter,
    BaseModuleAdapter
};
