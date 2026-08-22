# BLFX Custom Auto-Rec API Guide

To register your custom Auto-Recognition macros into the Boss Loot FX (BLFX) module, you should use the `blfx.register.CustomAutoRec` Foundry Hook.

## 1. The Hook Call
```javascript
Hooks.call('blfx.register.CustomAutoRec', resources, moduleName, version);
```

**Parameters:**
- `resources` *(Object | String)*: The custom Auto-Recognition data to import. It must be an object (or a valid JSON string) following a specific nested structure.
- `moduleName` *(String)*: Your module's identifier (e.g., `'my-custom-module'`). Used by BLFX to track versioning and prevent redundant updates.
- `version` *(String)*: The current version of your module (e.g., `'1.0.0'`).

## 2. The Expected Data Structure
The `resources` object must match the exact nested flag structure used by BLFX internally. 

```json
{
  "flags": {
    "boss-loot-assets-premium": {
      "customAutoRecognition": {
        "dnd5e": {
          "item-name-slug": {
            "activity-name-slug": {
              "triggerMode": {
                "animationName": "Name to display in UI",
                "itemName": "Item Name",
                "activityName": "Activity Name",
                "triggerName": "triggerMode",
                "note": "Optional notes",
                "animationData": {
                  "command": "// Your javascript macro code here"
                }
              }
            }
          }
        }
      }
    }
  }
}
```
*Structure Breakdown: `systemId` -> `itemNameSlug` -> `activityNameSlug` -> `triggerMode`.* (Trigger modes include `afterItemUse`, `afterAttack`, `afterDamage`, etc.).

## 3. Effect: OVERWRITE vs MERGE (Important!)
**Effect:** **OVERWRITE**
When you call this hook, BLFX will completely **overwrite** the user's existing `blfxCustomAutoRecognition` setting with the provided data. **It does not merge.**

Because it is a full overwrite, BLFX implements safety constraints:
1. **Version Checking**: When successfully imported, BLFX saves your `moduleName` and `version` to a setting. The hook will silently ignore any subsequent calls where the `version` passed is older than or equal to the stored version. This prevents the hook from overwriting the user's data on every world reload. 
2. **User Overrides**: Users have a module setting (`blfxCustomAutoRecUpdates`) to outright block external modules from pushing updates to their Custom Auto-Rec menu.
3. **Permissions**: The update will only execute if the active user is a GM (`game.user.isGM`).

*(Note: If you need to non-destructively merge, you would currently have to read `game.settings.get('boss-loot-assets-premium', 'blfxCustomAutoRecognition')`, manually merge your data into that object, and then pass the combined result to the Hook).*
