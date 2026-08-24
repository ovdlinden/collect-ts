export class MultipleItemsFoundException extends Error {
	public count: number;

	constructor(count: number) {
		super(`${count} items were found.`);
		this.name = 'MultipleItemsFoundException';
		this.count = count;
	}

	getCount(): number {
		return this.count;
	}
}
