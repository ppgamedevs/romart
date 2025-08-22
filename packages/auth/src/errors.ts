export class UnauthorizedError extends Error {
	constructor(message = "Unauthorized") {
		super(message)
		this.name = "UnauthorizedError"
	}
}

export class ForbiddenError extends Error {
	constructor(message = "Access forbidden") {
		super(message)
		this.name = "ForbiddenError"
	}
}

export class RateLimitError extends Error {
	constructor(message = "Rate limit exceeded") {
		super(message)
		this.name = "RateLimitError"
	}
}
