export interface PipelineStep {
	method: string;
	args: unknown[];
	input: unknown[];
	output: unknown;
	itemCount: number;
	duration: number;
}

export interface InstrumentedResult {
	result: unknown;
	steps: PipelineStep[];
}

const TERMINAL_METHODS = new Set([
	'all',
	'toArray',
	'first',
	'last',
	'count',
	'sum',
	'avg',
	'min',
	'max',
	'median',
	'mode',
	'isEmpty',
	'isNotEmpty',
	'contains',
	'every',
	'some',
	'join',
	'implode',
	'toJson',
	'reduce',
	'pipe',
	'tap',
	'dd',
	'dump',
]);

function isCollection(value: unknown): boolean {
	return value !== null && typeof value === 'object' && typeof (value as any).all === 'function';
}

function getItemCount(value: unknown): number {
	if (Array.isArray(value)) return value.length;
	if (isCollection(value)) return (value as any).count();
	if (typeof value === 'object' && value !== null) return Object.keys(value).length;
	return 1;
}

function snapshotValue(value: unknown, depth = 0): unknown {
	if (depth > 10) return value; // Prevent infinite recursion

	if (isCollection(value)) {
		// Recursively unwrap the collection's contents
		const all = (value as any).all();
		return snapshotValue(all, depth + 1);
	}
	if (Array.isArray(value)) {
		return value.map((item) => snapshotValue(item, depth + 1));
	}
	if (typeof value === 'object' && value !== null) {
		const result: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(value)) {
			result[key] = snapshotValue(val, depth + 1);
		}
		return result;
	}
	return value;
}

function createProxy<T extends object>(target: T, steps: PipelineStep[], inputItems: unknown[]): T {
	return new Proxy(target, {
		get(obj, prop, receiver) {
			const value = Reflect.get(obj, prop, receiver);

			if (typeof prop === 'symbol' || typeof value !== 'function') {
				return value;
			}

			const methodName = String(prop);

			return function (this: unknown, ...args: unknown[]) {
				const start = performance.now();
				const result = value.apply(obj, args);
				const duration = Math.round((performance.now() - start) * 100) / 100;

				const outputSnapshot = snapshotValue(result);
				const itemCount = getItemCount(result);

				steps.push({
					method: methodName,
					args: args.map(snapshotValue),
					input: inputItems,
					output: outputSnapshot,
					itemCount,
					duration,
				});

				if (TERMINAL_METHODS.has(methodName) || !isCollection(result)) {
					return result;
				}

				const nextInput = Array.isArray(outputSnapshot) ? outputSnapshot : [outputSnapshot];
				return createProxy(result, steps, nextInput);
			};
		},
	});
}

export function createInstrumentedCollect(collectFn: (items: unknown) => unknown) {
	return function instrumentedCollect(items: unknown): { proxy: unknown; getSteps: () => PipelineStep[] } {
		const steps: PipelineStep[] = [];
		const initialItems = Array.isArray(items) ? [...items] : items;
		const collection = collectFn(items);

		const inputSnapshot = Array.isArray(initialItems) ? initialItems : [initialItems];

		const proxy = createProxy(collection as object, steps, inputSnapshot);

		return {
			proxy,
			getSteps: () => steps,
		};
	};
}

export function executeWithInstrumentation(code: string, collectFn: (items: unknown) => unknown): InstrumentedResult {
	const steps: PipelineStep[] = [];

	const instrumentedCollect = (items: unknown) => {
		const initialItems = Array.isArray(items) ? [...items] : items;
		const collection = collectFn(items);
		const inputSnapshot = Array.isArray(initialItems) ? initialItems : [initialItems];

		steps.push({
			method: 'collect',
			args: [initialItems],
			input: inputSnapshot,
			output: inputSnapshot,
			itemCount: Array.isArray(initialItems) ? initialItems.length : 1,
			duration: 0,
		});

		return createProxy(collection as object, steps, inputSnapshot);
	};

	let result: unknown;

	// Check if code is a simple expression or multi-statement
	const isMultiStatement = /^\s*(const|let|var|if|for|while|function|class)\b/.test(code);

	if (isMultiStatement) {
		// For multi-statement code, find the last expression and return it
		// Split into statements, make the last one a return if it's an expression
		const lines = code.trim().split('\n');
		const lastLine = lines[lines.length - 1].trim();

		// If last line looks like a standalone expression (object, array, identifier, etc.)
		const isExpression =
			/^[[{a-zA-Z_$]/.test(lastLine) &&
			!lastLine.startsWith('const ') &&
			!lastLine.startsWith('let ') &&
			!lastLine.startsWith('var ');

		let wrappedCode: string;
		if (isExpression) {
			// Return the last expression
			const allButLast = lines.slice(0, -1).join('\n');
			wrappedCode = `${allButLast}\nreturn (${lastLine})`;
		} else {
			wrappedCode = code;
		}

		const evalFn = new Function('collect', wrappedCode);
		result = evalFn(instrumentedCollect);
	} else {
		// For single expressions, wrap in return
		const evalFn = new Function('collect', `return (${code})`);
		result = evalFn(instrumentedCollect);
	}

	return {
		result: snapshotValue(result),
		steps,
	};
}
