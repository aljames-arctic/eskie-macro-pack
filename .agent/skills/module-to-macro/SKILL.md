---
name: module-to-macro
description: How to convert an effect in src/animation into a stand-alone macro to run inside of Foundry VTT. Make sure to use this skill whenever the user asks to convert an animation, create a standalone macro from an effect, or change a module animation to a macro, even if they don't explicitly say "module to macro".
---

# Module to Macro Conversion

When a user asks to convert an effect from the `src/animation/` directory into a stand-alone macro for Foundry VTT, follow these instructions to ensure the macro is self-contained, fully functional, and well-formatted.

## Core Conversion Steps

1. **Locate the Effect File**: Find the relevant animation script in `src/animation/effects/`.
2. **Handle Multiple Variants**: Check if the effect has multiple variants (e.g., `rage` has `_rage.js` which exports `v1`, `v2`, `v3`, etc.). 
   > **CRITICAL**: If the user specifies an effect with multiple variants (such as the Rage effect), **STOP** and ask the user to clarify which version they want output before proceeding. Do not guess or output all variants.
3. **Extract the Sequence**: Extract the core `new Sequence()` logic from the `create` or `play` functions of the effect.
4. **Remove Module Dependencies & Use Standalone `closest()` Helper**:
   - Remove top-level ES module `import` statements (like `import { closest }` or `import { autorec }`).
   - Define a standalone `closest` helper snippet at the top of the macro so Patreon/Free JB2A asset paths resolve dynamically in live Foundry environments:
     ```javascript
     const closest = (path) => {
         if (typeof eskie !== "undefined" && eskie.util?.file?.closest) return eskie.util.file.closest(path);
         const apiClosest = game.modules?.get("eskie-macros")?.api?.util?.closest;
         if (typeof apiClosest === "function") return apiClosest(path);
         return path;
     };
     ```
   - Always wrap `.file(...)` and `.sound(...)` database keys with `closest(...)` (e.g. `.file(closest("jb2a.magic_missile"))`).
5. **CRITICAL: Zero Sequence Path Hallucinations & Key Verification**:
   - **Never invent, hallucinate, or guess JB2A, BLFX, or PSFX sequence paths.**
   - Every database key string (`jb2a.*`, `blfx.*`, `psfx.*`) used in `.file(...)` or `.sound(...)` must exist in standard JB2A / Sequencer packs.
   - **Common JB2A Naming Rules**:
     - Generic impact numbers are 3-digit zero-padded: `"jb2a.impact.001.orange"`, `"jb2a.impact.005.blue"` (NEVER two-digit `"jb2a.impact.01.orange"`).
     - Ground cracks fall under the `impact.` prefix: `"jb2a.impact.ground_crack.01.orange"` (NEVER `"jb2a.ground_cracks.orange.01"`).
     - Magic signs completion uses `.intro.` / `.loop.` / `.outro.` or `.complete.01`: e.g. `"jb2a.magic_signs.circle.02.necromancy.intro.dark_purple"` (NEVER `.complete.dark_purple`).
     - Portals use `.vortex.` or `.ring.vortex.`: e.g. `"jb2a.portals.vertical.vortex.yellow"` (NEVER `.portals.vertical.ring.yellow`).
     - Fireplace is single word: `"jb2a.fireplace.01.orange"` (NEVER `"jb2a.fire_place..."`).
     - Fog is `"jb2a.fog.01.grey"` (NEVER `"jb2a.fog_of_war..."`).
     - Fireball is `"jb2a.fireball.fireball.orange"` (NEVER `"jb2a.fireball.meteor..."`).
   - If adding extra flare or presets to a macro (like Wing Type choices or explosion cascades), verify every sequence string against known JB2A keys.
6. **Dynamic Variations vs Mustache Interpolation**:
   - Avoid passing static Mustache syntax strings (`"jb2a.impact.{{color}}"`) into `.file(...)` when wrapped in `closest()`.
   - Instead, use a dynamic JavaScript arrow function callback inside `.file(...)`:
     ```javascript
     const colors = ["jb2a.impact.001.yellow", "jb2a.impact.005.orange", "jb2a.impact.004.blue"];
     seq.effect().file(() => closest(colors[Math.floor(Math.random() * colors.length)]));
     ```
7. **Canonical Sequencer Options**:
   - Use `bindRotation: false` (not `followRotation: false`) inside `.attachTo()` or `.atLocation()` option objects.
8. **Preserve Audio Sequences**:
   - Do not omit `.sound(...)` sequences present in the modular effect source. Include sound volume/enable settings.
9. **Set up Target/Source Variables**: 
   - In a module, `source`, `token`, or `target` are passed as arguments.
   - In a macro, define these at the top of the script using Foundry globals (e.g. `const token = canvas.tokens.controlled[0];` or `const target = game.user.targets.first();`).
   - Add safety checks to return early if the necessary tokens are not selected.
   - **Note**: Remember the project rule: *If adding or changing an if statement that immediately returns, write it as a single line. For example: `if (!token) return ui.notifications.warn("No token");`*
10. **Implement Toggle Functionality (Play/Stop)**:
   - The first time the macro is called, the effect should be played.
   - If the original effect includes a `stop()` function, or if it persists an effect on a token using `.persist()`, the macro should function as a toggle.
   - The second time the macro is called, the effect should be stopped using the logic from the `stop()` function (e.g. `Sequencer.EffectManager.endEffects({ name: label, object: token })`).
   - Use `Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0` to check if the effect is currently playing.
11. **Output the Macro**: Write the resulting JavaScript code into `src/standalone-macros/` following the naming convention of the existing files. For effects with multiple variants, the filename should include the variant name (e.g. `rage-electric.js`, `rage-super-saiyan.js`, etc.).
12. **CRITICAL: Strict `src/*` Asset Source Parity Rule**:
    - Every literal sequence key string (`jb2a.*`, `eskie.*`, `psfx.*`, `blfx.*`) used in a standalone macro script MUST be checked against the corresponding modular original file in `src/animation/`.
    - If a standalone macro includes an asset path that did NOT exist in its `src/*` modular original script, verify whether it is a valid runtime sequence or delete/replace it with the canonical `src/*` original asset. Never invent custom preset particle options without confirming their presence in the `src/*` codebase or JB2A.

## Concrete Example: Before & After

### Before: Module Effect (e.g., src/animation/effects/buff/example.js)
```javascript
import { closest } from "../../../../lib/filemanager.js";
import { autorec } from "../../../../adapters/modules/autorec/autorec.js";

const DEFAULT_CONFIG = { color: 'red' };

function create(token, config = {}) {
    const { color } = foundry.utils.mergeObject(DEFAULT_CONFIG, config, { inplace: false });
    let seq = new Sequence()
        .effect()
        .name(`exampleBuff - ${token.id}`)
        .file(closest(`jb2a.impact.ground_crack.${color}.02`))
        .atLocation(token)
        .size(3.5, { gridUnits: true })
        .persist();
    return seq;
}

export const exampleBuff = { 
    create, 
    play: async (t, c) => (await create(t, c))?.play(),
    stop: async (t) => Sequencer.EffectManager.endEffects({ name: `exampleBuff - ${t.id}`, object: t })
};
```

### After: Standalone Macro
```javascript
// Standalone Macro
const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Please select a token!");

const color = 'red';
const label = `exampleBuff - ${token.id}`;

const isPlaying = Sequencer.EffectManager.getEffects({ name: label, object: token }).length > 0;

if (isPlaying) {
    Sequencer.EffectManager.endEffects({ name: label, object: token });
} else {
    new Sequence()
        .effect()
        .name(label)
        .file(`jb2a.impact.ground_crack.${color}.02`)
        .atLocation(token)
        .size(3.5, { gridUnits: true })
        .persist()
        .play();
}
```

## Evals

To ensure the reliability of this skill, test cases should be maintained in `evals/evals.json` covering various effect formats (e.g., simple template animations vs multi-target active effects).
