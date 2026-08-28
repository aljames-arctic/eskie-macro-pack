import { adapter } from '../adapters/index.js';

/**
 * Displays a button-choice dialog using Foundry's native DialogV2 via the unified adapter.
 * Drop-in replacement for the deprecated warpgate.buttonDialog().
 *
 * @param {{ buttons: {label: string, value: any}[], title?: string }} buttonData
 * @param {object} [options={}] Extra options forwarded to DialogV2.wait()
 * @returns {Promise<string|false>} The chosen button's value as a string, or false on cancel.
 */
async function buttonDialog(buttonData, options = {}) {
    return adapter.buttonDialog(buttonData, options);
}

export const dialog = { buttonDialog };
