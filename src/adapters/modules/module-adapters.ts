import { MidiQolModuleAdapter } from './midi-qol/midi-qol-module-adapter.js';
import { AutoanimationsModuleAdapter } from './autoanimations/autoanimations-module-adapter.js';
import { BlfxModuleAdapter } from './blfx/blfx-module-adapter.js';
import { SocketlibModuleAdapter } from './socketlib/socketlib-module-adapter.js';
import { MassEditModuleAdapter } from './mass-edit/mass-edit-module-adapter.js';
import { TokenAttacherModuleAdapter } from './token-attacher/token-attacher-module-adapter.js';

/**
 * Registry of known module adapters.
 * Maps module IDs to their corresponding adapter classes.
 */
export const MODULE_ADAPTERS = {
    'midi-qol': MidiQolModuleAdapter,
    'autoanimations': AutoanimationsModuleAdapter,
    'blfx': BlfxModuleAdapter,
    'boss-loot-assets-premium': BlfxModuleAdapter,
    'boss-loot-assets-free': BlfxModuleAdapter,
    'socketlib': SocketlibModuleAdapter,
    'multi-token-edit': MassEditModuleAdapter,
    'mass-edit': MassEditModuleAdapter,
    'token-attacher': TokenAttacherModuleAdapter
};
