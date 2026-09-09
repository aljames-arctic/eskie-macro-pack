import type { Adapter } from '../adapters/index.js';
import type { animation } from '../animation/index.js';
import type { standaloneMacros } from '../lib/standalone-macros.js';

declare global {
  var eskie: Record<string, any>;
  var Sequencer: any;
  var Tagger: any;
}

declare module 'fvtt-types/configuration' {
  namespace Hooks {
    interface HookConfig {
      'aa.ready': () => void | Promise<void>;
      'socketlib.ready': () => void | Promise<void>;
      [key: string]: (...args: any[]) => any;
    }
  }
}
