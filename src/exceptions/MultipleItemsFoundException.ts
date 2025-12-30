/**
 * Exception thrown when multiple items are found when only one was expected.
 */
export class MultipleItemsFoundException extends Error {
	/**
	 * The number of items found.
	 */
	public count: number;

	/**
	 * Create a new exception instance.
	 */
	constructor(count: number) {
		super(`${count} items were found.`);
		this.name = 'MultipleItemsFoundException';
		this.count = count;
	}

	/**
	 * Get the number of items found.
	 */
	getCount(): number {
		return this.count;
	}
}
