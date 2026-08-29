---
name: discord-effect-converter
description: Instructions for converting legacy Discord animations into the modern modular format in src/animation/effects. Make sure to use this skill whenever you are asked to "update scripts in the new-submissions folder" or convert any Discord animation scripts.
compatibility: Foundry VTT V12+
---

# Discord Animation to Modular Format Conversion

When asked to update scripts in the `new-submissions` folder or to convert Discord animations to the modular format, execute the following transformations. You MUST reference the template files in the `references/` directory to understand the exact target structure:
- For standard or token animations, read `references/template_token.js`. Save these to `src/animation/effects/token/` or `on-target/`.
- For active effects, read `references/template_active_effect.js`. Save these to `src/animation/effects/active-effect/`.

> [!NOTE]
> If a legacy script utilizes a position or crosshair (`Sequencer.Crosshair.show`) to place effects at, it is considered a **template-driven** effect. You MUST read `references/template_template.js` to understand its unique structure. These should be saved to `src/animation/effects/template/`.

## Code Style

*   **Apply Style Guide:** Ensure that all generated or updated code adheres strictly to the project's coding conventions. You MUST refer to the `style-guide` skill (located in `.agent/skills/style-guide/SKILL.md`) and apply its rules (e.g., 4-space indentation, semicolons, single quotes, 1TBS brace style, single-line if-statements, nullish coalescing `??` for defaults, standard logger) to the resulting module file.

## General Transformations

*   **Modular Structure:** Encapsulate the animation logic within an `export async function create(...)` function. This function MUST return a `Sequence` object.
*   **Root Exports:** The final module MUST export an object containing `create`, `play`, and `stop` at its root level. The `create` method is absolutely mandatory because the Automated Animations and Boss Loot FX integrations directly call `animation.create(token, config)`!
*   **Toggle Logic (Tagger):** Do NOT use `Tagger` to manage toggling features on/off inside the module's `create` function. The `create` function should solely generate the Sequence to turn the effect on. Use the `stop` function to end the effect.
*   **Parameter Handling:**
    *   **Token & Active Effects:** Pass the casting token as `source`. 
        *   If the animation only affects a single target, pass it as `target`. Signature: `(source, target, config = {})`.
        *   If the animation affects multiple targets, pass them as an array `targetTokens`. Signature: `(source, targetTokens, config = {})`.
        *   Pass configurations as `config`.
    *   **Template Effects:** Template effects only receive two arguments: `(source, config = {})`. Target tokens MUST be extracted via `config.targets?.length ? config.targets : Array.from(game.user.targets)`.
*   **Template Positioning:** If `config.template` exists, extract the position via `adapter.getTemplatePosition(config.template)` rather than manual deep traversal. Refer to `template_template.js`.
*   **Multi-Target Timing:** When iterating over multiple targets with a delay (e.g., waiting 2 seconds before striking each), do NOT chain `.wait()` sequentially on the main sequence. You MUST create a new isolated Sequence for each target (`let targetSeq = new Sequence().wait(1000)`) and add it to the main sequence using `sequence.addSequence(targetSeq)`. This prevents cumulative, compounding delays.
*   **File Relocation:** Move the newly converted file from its input folder (e.g., `new-submissions`) to `src/animation/effects/`.
*   **Module Integration:** Update `src/animation/effects/_effects.js` to import and export the new modular animation.
*   **Variable Renaming:** Rename global variables like `targets` to `target` (for single-target) or `targetTokens` (for multi-target) to fit the modular function signature.
*   **Image Path Conversion:** You MUST wrap EVERY argument passed to `.file(...)` with the `closest(...)` function, regardless of whether it is an image, video, http link, or Sequencer database path. For example, `.file('https://i.imgur.com/image.png')` MUST become `.file(closest('https://i.imgur.com/image.png'))`. Make sure to import `closest` from `../../../lib/filemanager.js` (adjusting the relative path as necessary).
*   **Effect Comments:** Add descriptive comments explaining the visual or functional purpose of each effect or sequence chunk.
*   **Standard Configuration Pattern:**
    *   Every animation MUST have a global `const DEFAULT_CONFIG` object defined at the top level of the file.
    *   If a legacy script has a local `default_config` (inside `create` or `play`), you MUST move it to the global namespace as `DEFAULT_CONFIG`.
    *   This `DEFAULT_CONFIG` MUST be exported as `default_config` in the root export object of every animation module.
    *   **Exclusion**: Index or collection files (typically named `_*.js` or `index.js`) that only group and re-export other animations do NOT need to define or export a `default_config` of their own.
    *   If the export object contains nested API objects (e.g., `cast`, `target`), ensure `default_config` is present in those as well if they utilize it.
    *   Inside `create`, `play`, and `stop`, use `adapter.mergeObject(DEFAULT_CONFIG, config)` (imported from `../../../adapters/index.js`) for safe, non-inplace configuration management.
    *   Example: `const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config);`
*   **Helper Functions:** Extract complex sequences of effects into smaller, logically grouped helper functions (e.g., `_castSpellEffects(sequence, token)`).
*   **Sound Configuration Pattern (Default Addition):**
    *   EVERY converted or new animation MUST include a `sound` section in `DEFAULT_CONFIG` by default (even if currently unconfigured), ready for user and GM audio customization.
    *   Import `{ applySound, DEFAULT_SOUND_CONFIG }` from `'../../utils/sound.js'` (adjusting the relative path as necessary).
    *   In `DEFAULT_CONFIG`, include a default sound section using `DEFAULT_SOUND_CONFIG`:
        ```javascript
        sound: {
            ...DEFAULT_SOUND_CONFIG,
            enable: false,
            file: '',
        }
        ```
    *   **Standard Sound Properties Contract**:
        1. `enable` (boolean): Canonical boolean flag (`true`/`false`). Never use `enabled`.
        2. `file` (string): Sequencer database key or audio file path.
        3. `delay` (number): Start delay in ms.
        4. `volume` (number): Playback volume (0.0 to 1.0, default 0.5).
        5. `fadeIn` (number): Audio fade-in duration in ms.
        6. `fadeOut` (number): Audio fade-out duration in ms.
        7. `startTime` / `endTime` / `timeRange`: Audio timestamp clipping in ms.
        8. `repeats`: Repeat count or `[count, delayMin, delayMax]`.
    *   **Existing Sound Paths vs Unconfigured Animations**:
        *   If the legacy script already had established sound effects, populate the `file` path, set `enable: true`, and preserve volume/delay. If multiple sounds are warranted (e.g. `intro` / `outro` or `charge` / `impact`), define named sub-objects or an array in `sound`.
        *   If the legacy script did NOT have sound effects, do NOT recommend or invent specific sounds. Simply provide the default unconfigured sound section (`enable: false, file: ''`).
    *   **Apply Sound via Sequence Helper**:
        *   Pass the sequence and sound config directly into `applySound`:
            ```javascript
            applySound(sequence, sound);
            ```
        *   For multi-sound animations, pass the corresponding sound sub-object at the appropriate point in the sequence: `applySound(sequence, sound.charge);`.
    *   **Settings Override**:
        *   Import `{ settingsOverride }` from `'../../../lib/settings.js'` and call `config = settingsOverride(config);` at the start of `create` (and `play`, if it merges config) so global audio settings override disabled sounds.

## API Updates

Ensure the script uses the latest Foundry VTT API patterns:

*   Replace `target.data.name` with `target.name`.
*   Replace `target.document.data.width` with `target.document.width`.
*   Replace `warpgate.crosshairs.show` with `Sequencer.Crosshair.show`.
*   Change the `t` property in the crosshairs configuration from `'line'` to `'ray'` for valid measured template types.
*   Replace deprecated `.from()` methods with `.copySprite()`.
*   **`scaleToObject` Convention:** Every `.scaleToObject(...)` call MUST include `{ considerTokenScale: true }` as its options argument. When scaling an effect to match the token's natural size, always use `.scaleToObject(1, { considerTokenScale: true })`. Never pass `token.document.texture.scaleX` as the scale value — this is already accounted for by the `considerTokenScale` option. For effects intentionally larger or smaller than the token, use a numeric multiplier (e.g. `.scaleToObject(1.5, { considerTokenScale: true })`).
*   Replace `warpgate.buttonDialog(buttonData)` with `adapter.buttonDialog(buttonData)` (or `eskie.util.dialog.buttonDialog(buttonData)`). The `buttonData` shape is identical — a `buttons` array with `label` and `value` fields, plus an optional `title`. When converting, **replace any numeric `value` fields with descriptive string identifiers** that reflect the semantic meaning of that choice (e.g., `{ label: 'Hybrid Form', value: 'hybrid' }`). Since `DialogV2` always returns strings, this also eliminates any type-mismatch issues.

## Bug Fixes

*   Use `adapter.getSceneBackground(canvas.scene)` to safely resolve background textures across Foundry V12/V13 Scenes and V14+ Levels.

## Attribution

*   **Original Author:** Include a comment at the top of the file crediting the original author of the animation.
*   **Updater:** Add a comment at the top of the file crediting `bakanabaka` as the author of the modular conversion.
*   **README Credits:** Check if the original author is already listed in the `README.md` under "Animation Contributors". If they are a new contributor, you MUST add their name to the list in alphabetical order (if possible, or at the bottom if not).
