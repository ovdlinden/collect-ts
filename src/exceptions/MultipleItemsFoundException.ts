export class MultipleItemsFoundException extends Error {
	constructor(
		public readonly count: number,
		public readonly method?: string,
	) {
		const message = `${count} items were found.`;
		super(method ? `${method}(): ${message}` : message);
		this.name = 'MultipleItemsFoundException';
	}

	getCount(): number {
		return this.count;
	}
}
