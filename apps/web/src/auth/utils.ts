import { auth } from "./simple"

export async function getAuthSession() {
  return await auth()
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Authentication required")
  }
  return session
}
