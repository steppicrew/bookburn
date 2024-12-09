export const makeRandom = (seed: number) => {
    return (): number => {
        // Linear Congruential Generator constants
        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;

        seed = (a * seed + c) % m;
        return seed;
    };
};
