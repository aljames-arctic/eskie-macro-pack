---
name: style-guide
description: Coding style guidelines, architectural contracts, and conventions for the eskie-macro-pack project. Make sure to use this skill whenever you write, edit, or refactor ANY code in this repository, to ensure consistency with the project's formatting and patterns.
---

# Eskie Macro Pack Style Guide

When writing or modifying code in the `eskie-macro-pack` repository, adhere strictly to the following architectural guidelines and coding conventions.

## 1. Project Directory Layout & Architectural Layers

*   **`src/adapters/`**: Centralized adapter layer decoupling the macro pack from platform versions, game systems, and third-party modules:
    *   `foundry/`: Platform generation adapters (`BaseFoundryAdapter` for V12/V13 baseline, `FoundryCurrentAdapter` for modern V14+ centered tiles/levels/regions).
    *   `system/`: Game system adapters (`Dnd5eSystemAdapter`, `Pf2eSystemAdapter`, `GenericSystemAdapter`).
    *   `modules/`: Third-party module adapters (`autoanimations/`, `blfx/`, `midi-qol/`, `socketlib/`, `mass-edit/`, `token-attacher/`, `autorec/`).
    *   `index.js`: Unified singleton `adapter` (`adapter.foundry`, `adapter.system`, `adapter.autoanimations`, `adapter.blfx`, `adapter.socketlib`, `adapter.midiQol`, `adapter.massEdit`, `adapter.tokenAttacher`, `adapter.autorec`).
*   **`src/ui/`**: Centralized user interface layer. ALL `ApplicationV2` classes, Handlebars templates, settings menus, and interactive dialogs live here (`recommended-modules/`, `world-scripts/`, `autoanimations/`, `blfx/`, `autorec/`).
*   **`src/world-scripts/`**: Runtime script loader and execution triggers (`loader.js`, `rollAnimation.js`). UI menus reside in `src/ui/world-scripts/`.
*   **`src/animation/`**: Modular animation effects (`effects/`), masks (`mask/`), scene overlays (`scene-overlays/`), showcases (`showcase/`), traps (`traps/`), and animation helpers (`utils/`).
*   **`src/standalone-macros/`**: Standalone, copy-paste-ready JavaScript macros for Foundry VTT.
*   **`src/lib/`**: Core shared utilities (`constants.js`, `dependency.js`, `filemanager.js`, `logger.js`, `utils.js`, `settings.js`).

## 2. General Formatting & Syntax

*   **Indentation:** Use exactly 4 spaces for indentation. Never use tabs.
*   **Semicolons:** Always terminate statements with a semicolon (`;`).
*   **Quotes:** Use single quotes (`'`) for standard strings. Use backticks (`` ` ``) for template literals/interpolation. Avoid double quotes (`"`) unless escaping single quotes is necessary.
*   **Brace Style:** Use the One True Brace Style (1TBS). The opening brace must be on the same line as the statement:
    ```javascript
    function example() {
        // ...
    }
    ```
*   **Single-Line If-Returns:** If an `if` statement immediately returns or executes a single action, write it as a concise single line:
    ```javascript
    if (!token) return ui.notifications.warn('No token selected');
    ```

## 3. Strict Nullish Coalescing vs. Logical OR Separation

*   **Property & Value Fallbacks (`??`):** Always use nullish coalescing (`??`) when providing fallback default values (e.g., `const count = config.count ?? 0;` or `const name = item?.name ?? '';`). Never use logical OR (`||`) for value fallbacks, as `||` overrides valid falsy primitives (`0`, `false`, `''`).
*   **Boolean Logic (`||`):** Strictly reserve logical OR (`||`) for evaluating boolean conditions (e.g., `if (isBroken || isMissing)`).

## 4. Modern Idiomatic Typing & Defensive Coding Aversion

*   **Avoid Redundant `globalThis` and Defensive Checks:** Do NOT clutter code with defensive checks like `typeof globalThis !== 'undefined'`, `typeof window !== 'undefined'`, or prefixing standard globals with `globalThis.` (unless required for disambiguating a local identifier of the same name).
*   **Trust Foundry Globals & Optional Chaining:** Rely on standard Foundry globals (`game`, `foundry`, `canvas`, `ChatMessage`, `Token`, `Tile`, etc.) and modern JavaScript optional chaining (`?.`) instead of verbose `typeof`, `instanceof`, or `Array.isArray` guard chains.

## 5. Modules, Exports, and Naming

*   **Variables and Functions:** Use `camelCase`.
*   **Constants:** Use `UPPER_SNAKE_CASE` (e.g., `MODULE_ID`).
*   **Exports:** Prefer named exports. Do not declare functions inline inside exported object literals; declare the function separately first, then export it:
    ```javascript
    function doSomething() {
        // ...
    }

    export const actions = {
        doSomething
    };
    ```

## 6. Logging Level Hierarchy

*   **Use Project Logger (`lib/logger.js`):** Import `log` from `lib/logger.js` (`import { log } from '../../lib/logger.js';`). The logger automatically manages prefixes (`'EMP | '`) and verbosity settings.
*   **`log.error`**: Strictly use for unexpected exceptions or unrecoverable fatal failures.
*   **`log.warn`**: Strictly use for expected but non-fatal issues (e.g., missing optional dependency, graceful degradation).
*   **`log.info`**: Strictly reserve for high-level lifecycle or status updates (e.g., `"Initializing module"`, `"World Scripts Loaded"`). Never use `log.info` for internal data dumps.
*   **`log.debug`**: Use for inspecting internal data structures, comparison trees, variable payloads, and execution tracing.

## 7. Foundry Platform & D&D 5e Contracts

*   **Modern Baseline (Zero Legacy Fallbacks):** All code targets modern Foundry VTT (v12+/v14+) and modern system schemas (D&D 5e v4+).
*   **D&D 5e SpellData Contracts:**
    *   Method: `item.system.method ?? 'prepared'`
    *   Prepared: `Boolean(item.system.prepared)`
    *   Never access or fallback to deprecated `item.system.preparation`.
*   **Flag Scope:** Always import `MODULE_ID` from `lib/constants.js` and use it for flags (e.g., `doc.getFlag(MODULE_ID, ...)`). Never hardcode `'eskie-macro-pack'` as the scope key because the active module ID is `'eskie-macros'`.
*   **Scene Backgrounds:** Route background texture and offset queries through `adapter.getSceneBackground(scene)` to support Foundry V14+ Levels seamlessly.

## 8. Sequencer & Asset Standards

*   **Optional Asset Libraries:** Protect optional asset libraries (like `psfx`) inside an `if` check rather than `.playIf(...)`, preventing `closest()` from throwing if the pack is not installed.
*   **`copySprite` Rotation Fix:** Every `.copySprite(token)` effect MUST include `.spriteRotation(-token.document.rotation)` immediately after to counteract token world rotation.
*   **`scaleToObject` Convention:** Always use `.scaleToObject(scale, { considerTokenScale: true })`.
*   **Zero Sequence Path Hallucinations:** Always verify database keys against standard JB2A / Sequencer naming conventions.

## 9. Automated Linting

*   Before finalizing code changes, run the linter script on any modified JavaScript files:
    ```bash
    python .agent/skills/style-guide/scripts/lint.py <path/to/file.js>
    ```
