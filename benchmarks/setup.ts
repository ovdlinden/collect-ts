import { beforeEach } from 'vitest';

beforeEach(() => {
	if (typeof globalThis.gc === 'function') {
		globalThis.gc();
	}
});
