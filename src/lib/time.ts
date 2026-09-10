/**
 * Pauses execution for a specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>} A promise that resolves after the specified delay.
 */
async function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export interface WaitUntilOptions {
    timeout?: number;
    interval?: number;
}

/**
 * Waits until a condition function returns true.
 * @param {() => boolean | Promise<boolean>} condition - A function that returns a boolean.
 * @param {WaitUntilOptions} [options] - Optional parameters.
 * @param {number} [options.timeout=2000] - The maximum time to wait in milliseconds.
 * @param {number} [options.interval=100] - The interval at which to check the condition in milliseconds.
 * @returns {Promise<number>} A promise that resolves with the time elapsed in milliseconds, or rejects if the timeout is reached.
 */
async function waitUntil(
    condition: () => boolean | Promise<boolean>,
    { timeout = 2000, interval = 100 }: WaitUntilOptions = {}
): Promise<number> {
    return new Promise((resolve, reject) => {
        const startTime = game.time.serverTime;
        const check = async () => {
            try {
                if (await condition()) {
                    resolve(game.time.serverTime - startTime);
                } else if (game.time.serverTime - startTime > timeout) {
                    reject(new Error("Timeout waiting for condition."));
                } else {
                    setTimeout(check, interval);
                }
            } catch (err) {
                reject(err);
            }
        };
        check();
    });
}

export const time = {
    wait,
    waitUntil,
};