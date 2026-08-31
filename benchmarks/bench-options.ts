/**
 * Shared benchmark configuration for stable, reproducible results.
 *
 * These settings increase warmup and sample time to reduce variance
 * from JIT compilation and GC interference.
 */
export const STABLE_BENCH = {
	warmupTime: 1000,
	warmupIterations: 100,
	time: 3000,
	iterations: 100,
};
