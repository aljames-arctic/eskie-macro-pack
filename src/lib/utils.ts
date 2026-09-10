/**
 * Helper to safely localize a key, falling back to a default string if the key is not found.
 * @param {string} key - The translation key
 * @param {string} [fallback=key] - The fallback string if the key is not found (defaults to key)
 * @returns {string} The localized string or fallback
 */
export function localize(key: string, fallback: string = key): string {
    return game.i18n?.has?.(key) ? (game.i18n.localize?.(key) ?? fallback) : fallback;
}

/**
 * Helper to safely format a localized string with interpolation data.
 * @param {string} key - The translation key
 * @param {Record<string, unknown>} [data={}] - Interpolation data for the string
 * @param {string} [fallback=key] - The fallback string if the key is not found
 * @returns {string} The formatted string or fallback
 */
export function format(key: string, data: Record<string, unknown> = {}, fallback: string = key): string {
    return game.i18n?.has?.(key) ? (game.i18n.format?.(key, data) ?? fallback) : fallback;
}
