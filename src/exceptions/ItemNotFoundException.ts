/**
 * Exception thrown when an item is not found in a collection.
 */
export class ItemNotFoundException extends Error {
	constructor(message = 'Item not found.') {
		super(message);
		this.name = 'ItemNotFoundException';
	}
}
