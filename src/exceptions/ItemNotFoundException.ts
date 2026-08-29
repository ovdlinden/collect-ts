export class ItemNotFoundException extends Error {
	constructor(
		message = 'Item not found.',
		public readonly method?: string,
	) {
		super(method ? `${method}(): ${message}` : message);
		this.name = 'ItemNotFoundException';
	}
}
