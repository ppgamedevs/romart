import { auth } from "@/auth/config"

export async function getCurrentUser() {
	const session = await auth()
	return session?.user
}
