/**
 * Exception thrown when an invalid argument is provided.
 */
export class InvalidArgumentException extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'InvalidArgumentException';
	}
}
