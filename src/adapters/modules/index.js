import { BaseModuleAdapter } from './base-module-adapter.js';
import { MidiQolModuleAdapter, midiQolAdapter } from './midi-qol/midi-qol-module-adapter.js';
import { AutoanimationsModuleAdapter, autoanimationsAdapter, autoanimations, EMP_AA_Menu, CONCENTRATING as AA_CONCENTRATING, standardizeTrigger, createAutorecEntry } from './autoanimations/autoanimations-module-adapter.js';
import { BlfxModuleAdapter, blfxAdapter, blfx, EMP_BLFX_Registry, buildBlfxPayload, mergeBlfxCustomAutoRec, standardizeBlfxTrigger, buildBlfxMacroCommand } from './blfx/blfx-module-adapter.js';
import { SocketlibModuleAdapter, socketlibAdapter, socketlibapi, socket, socketlib } from './socketlib/socketlib-module-adapter.js';
import { AutorecManager, autorecManager, autorec, promptDestinationDialog, CONCENTRATING, register as autorecRegister, submit as autorecSubmit } from './autorec/autorec-module-adapter.js';
import { MassEditModuleAdapter, massEditAdapter, massEdit } from './mass-edit/mass-edit-module-adapter.js';
import { TokenAttacherModuleAdapter, tokenAttacherAdapter, tokenAttacher } from './token-attacher/token-attacher-module-adapter.js';
import { MODULE_ADAPTERS } from './module-adapters.js';
import { log } from '../../lib/logger.js';

/**
 * Instantiates all active third-party module adapters.
 * @returns {Map<string, BaseModuleAdapter>}
 */
export function initializeModuleAdapters() {
    const activeMap = new Map();
    for (const [moduleId, AdapterClass] of Object.entries(MODULE_ADAPTERS)) {
        if (game?.modules?.get(moduleId)?.active) {
            try {
                activeMap.set(moduleId, new AdapterClass());
                log.info(`Initialized module adapter for: ${moduleId}`);
            } catch (error) {
                log.error(`Failed to register module adapter for ${moduleId}:`, error);
            }
        }
    }
    return activeMap;
}

/**
 * Check if at least one third-party module with a registered adapter is active in the current world.
 * @returns {boolean}
 */
export function hasActiveModuleAdapters() {
    return Object.keys(MODULE_ADAPTERS).some(moduleId => Boolean(game?.modules?.get(moduleId)?.active));
}

export {
    BaseModuleAdapter,
    MODULE_ADAPTERS,
    MidiQolModuleAdapter,
    midiQolAdapter,
    AutoanimationsModuleAdapter,
    autoanimationsAdapter,
    autoanimations,
    EMP_AA_Menu,
    AA_CONCENTRATING,
    standardizeTrigger,
    createAutorecEntry,
    BlfxModuleAdapter,
    blfxAdapter,
    blfx,
    EMP_BLFX_Registry,
    buildBlfxPayload,
    mergeBlfxCustomAutoRec,
    standardizeBlfxTrigger,
    buildBlfxMacroCommand,
    SocketlibModuleAdapter,
    socketlibAdapter,
    socketlibapi,
    socket,
    socketlib,
    AutorecManager,
    autorecManager,
    autorec,
    promptDestinationDialog,
    CONCENTRATING,
    autorecRegister,
    autorecSubmit,
    MassEditModuleAdapter,
    massEditAdapter,
    massEdit,
    TokenAttacherModuleAdapter,
    tokenAttacherAdapter,
    tokenAttacher
};
