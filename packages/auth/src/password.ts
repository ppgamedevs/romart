import * as argon2 from "argon2"

export async function hashPassword(plain: string): Promise<string> {
	return await argon2.hash(plain, {
		type: argon2.argon2id,
		memoryCost: 2 ** 16, // 64MB
		timeCost: 3, // 3 iterations
		parallelism: 1
	})
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
	try {
		return await argon2.verify(hash, plain)
	} catch (error) {
		console.warn("Password verification error:", error)
		return false
	}
}
