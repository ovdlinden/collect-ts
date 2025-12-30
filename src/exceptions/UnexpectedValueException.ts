/**
 * Exception thrown when a value does not match the expected type.
 */
export class UnexpectedValueException extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'UnexpectedValueException';
	}
}
