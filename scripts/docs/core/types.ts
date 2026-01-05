/**
 * Core types for documentation scripts
 * Pure type definitions - no I/O, no side effects
 */

import type { Collection } from '../../../src/index.js';

// ============================================================================
// Result Type (explicit error handling, no exceptions)
// ============================================================================

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// ============================================================================
// Domain Types
// ============================================================================

export interface CodeExample {
	language: string;
	code: string;
}

export interface MethodDoc {
	name: string;
	anchor: string;
	description: string;
	examples: CodeExample[];
}

export interface ParsedDocs {
	introduction: string;
	methods: Collection<MethodDoc>;
}

// ============================================================================
// Baseline Types
// ============================================================================

export interface BaselineStatus {
	exists: boolean;
	upToDate: boolean;
	baselinePath: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface FetchError {
	type: 'network' | 'http';
	message: string;
	status?: number;
}

export interface FileError {
	type: 'not_found' | 'permission' | 'read' | 'write';
	path: string;
	message: string;
}

// ============================================================================
// Config
// ============================================================================

export const LARAVEL_VERSION = '12.x' as const;
export const BASELINE_PATH = 'scripts/docs/baseline/laravel-collections.md' as const;
