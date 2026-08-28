---
name: auto-animations-diagnoser
description: Determines whether an animation effect should be registered with the auto-recognition (autorec) integration (supporting both Automated Animations and Boss Loot FX) and provides instructions for doing so. Make sure to use this skill whenever you convert a new effect or create an animation effect from scratch.
---

# Automated Animations & Boss Loot FX Autorec Diagnoser

Whenever you create or convert an animation effect, you must evaluate whether it qualifies to be registered with the unified `autorec` manager (which registers to both `autoanimations` and `blfx`).

## Diagnostic Criteria

Effects should be registered for automatic animation recognition if they meet **ANY** of the following criteria:

1.  **On a single token:** The animation plays on or around the casting token (e.g., self-buffs, simple actions).
2.  **Active effect on a token:** The animation is persistent and tied to an active effect on a token (e.g., Banishment, ongoing condition/damage).
3.  **Ranged/Melee attack:** The animation travels between two tokens (e.g., shooting an arrow, swinging a sword).
4.  **Template attack:** The attack uses a measured template (circle, cone, line, ray) or uses a position (like `Sequencer.Crosshair.show`) to place effects.

## Valid Triggers

When registering an effect, pass the standard trigger string:
- `"token"` / `"ontoken"` : Self-targeting or on-token ability
- `"template"` : Template-using ability or relies on a position/crosshair
- `"effect"` / `"aefx"` : Active effect applied
- `"melee-target"` / `"melee"` : Source -> Target melee animation
- `"ranged-target"` / `"range"` : Source -> Target ranged animation
- `"aura"` : Ongoing aura around token
- `"preset"` : General preset

## Registration Implementation

If the effect meets any of the above criteria, register it at the bottom of the effect's module file.

1.  **Import the Autorec Manager:**
    Add the following import at the top of the file (adjusting relative path as necessary):
    ```javascript
    import { autorec, CONCENTRATING } from '../../../adapters/modules/autorec/autorec.js';
    ```

2.  **Call the register method:**
    At the bottom of the file, after the function definitions and exports, invoke `autorec.register`:
    ```javascript
    autorec.register("Name of Effect", "trigger", "eskie.effect.effectName", DEFAULT_CONFIG, '1.0.0', 'Localized or Display Label');
    ```
    *   `"Name of Effect"`: The system key or human-readable effect name (e.g., `"Tasha's Caustic Brew"`).
    *   `"trigger"`: The trigger string from the Valid Triggers list (e.g., `"template"`, `"effect"`, `"token"`).
    *   `"eskie.effect.effectName"`: The dot-path to the effect within the exported module structure.
    *   `DEFAULT_CONFIG`: The default configuration object for the effect.
    *   `'1.0.0'`: The initial version string.
    *   `'Display Label'`: Optional display label.
