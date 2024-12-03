export const makeConsoleLogger = (prefix: string, disabled = false) => {
    const log = (...args: any) => {
        if (!disabled) {
            console.log(...[`${prefix}:`, ...args]);
        }
    };

    return { log };
};
