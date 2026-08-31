export class InvalidArgumentException extends Error {
	constructor(
		message: string,
		public readonly method?: string,
	) {
		super(method ? `${method}(): ${message}` : message);
		this.name = 'InvalidArgumentException';
	}
}
