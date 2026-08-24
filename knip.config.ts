import type { KnipConfig } from 'knip';

export default {
	project: ['src/**/*.ts'],
	ignoreDependencies: ['@babel/parser', '@babel/traverse', '@types/babel__traverse'],
} satisfies KnipConfig;
