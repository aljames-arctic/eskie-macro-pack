import { RecommendedModulesApp, RecommendedModulesFormApplication } from './recommended-modules/recommendedModulesMenu.js';
import { WorldScriptsApp, WorldScriptsFormApplication } from './world-scripts/worldScriptsMenu.js';
import { AutorecUpdateApp, autorecUpdateFormApplication } from './autoanimations/updateMenu.js';
import { BlfxAutorecUpdateApp, BlfxAutorecUpdateFormApplication } from './blfx/updateMenu.js';
import { ConfigureAutorecApp, ConfigureAutorecFormApplication } from './autorec/manageAutorecMenu.js';

export const ui = {
    recommendedModules: {
        App: RecommendedModulesApp,
        FormApplication: RecommendedModulesFormApplication,
    },
    worldScripts: {
        App: WorldScriptsApp,
        FormApplication: WorldScriptsFormApplication,
    },
    autoanimations: {
        App: AutorecUpdateApp,
        FormApplication: autorecUpdateFormApplication,
    },
    blfx: {
        App: BlfxAutorecUpdateApp,
        FormApplication: BlfxAutorecUpdateFormApplication,
    },
    autorec: {
        App: ConfigureAutorecApp,
        FormApplication: ConfigureAutorecFormApplication,
    }
};
