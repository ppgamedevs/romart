import { ForbiddenError } from "./errors"

export type Role = "ADMIN" | "ARTIST" | "BUYER"

export function hasRole(userRole: Role, required: Role | Role[]): boolean {
	const requiredRoles = Array.isArray(required) ? required : [required]
	return requiredRoles.includes(userRole)
}



export function requireRole<T>(userRole: Role, allowed: Role | Role[]): T | never {
	if (!hasRole(userRole, allowed)) {
		throw new ForbiddenError(`Access denied. Required role: ${Array.isArray(allowed) ? allowed.join(" or ") : allowed}`)
	}
	return undefined as T
}

// Role hierarchy helpers
export const ROLE_HIERARCHY: Record<Role, number> = {
	BUYER: 1,
	ARTIST: 2,
	ADMIN: 3
}

export function hasRoleOrHigher(userRole: Role, minimumRole: Role): boolean {
	return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole]
}
