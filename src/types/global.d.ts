export {};

declare global {
  var eskie: Record<string, any>;
  var Sequencer: any;
  var Sequence: any;
  var Tagger: any;
  var socketlib: any;
  var dnd5e: any;
  var FXMASTER: any;

  interface ModuleConfig {
    [key: string]: any;
  }

  interface FlagConfig {
    [key: string]: any;
  }

  interface SettingConfig {
    "eskie-macros.autorecTarget": string;
    "eskie-macros.enableSounds": boolean;
    "eskie-macros.worldScriptsConfig": Record<string, any>;
    "eskie-macros.autorecVersion": string;
    "eskie-macros.blfxAutorecVersion": string;
    "eskie-macros.logVerbosity": string;
    "sequencer.user-effect-opacity": number;
    "autoanimations.aaAutorec": Record<string, any>;
    "boss-loot-fx.blfxCustomAutoRecUpdates": boolean;
    "boss-loot-fx.blfxAutoRec": Record<string, any>;
  }

  namespace Hooks {
    interface HookConfig {
      'aa.ready': () => void;
      'socketlib.ready': () => void;
      'blfx.register.CustomAutoRec': (...args: any[]) => void;
    }
  }

  interface CONFIG {
    DND5E?: any;
    PF1?: any;
    PF2E?: any;
  }
}

declare module 'fvtt-types/configuration' {
  interface AssumeHookRan {
    ready: true;
  }

  interface SettingConfig {
    "eskie-macros.autorecTarget": string;
    "eskie-macros.enableSounds": boolean;
    "eskie-macros.worldScriptsConfig": Record<string, any>;
    "eskie-macros.autorecVersion": string;
    "eskie-macros.blfxAutorecVersion": string;
    "eskie-macros.logVerbosity": string;
    "sequencer.user-effect-opacity": number;
    "autoanimations.aaAutorec": Record<string, any>;
    "boss-loot-fx.blfxCustomAutoRecUpdates": boolean;
    "boss-loot-fx.blfxAutoRec": Record<string, any>;
  }

  namespace Hooks {
    interface HookConfig {
      'aa.ready': () => void;
      'socketlib.ready': () => void;
      'blfx.register.CustomAutoRec': (...args: any[]) => void;
    }
  }
}
