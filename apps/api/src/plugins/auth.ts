import { FastifyPluginAsync } from "fastify"
import { verifyJwt } from "@artfromromania/auth"
import { Role } from "@artfromromania/auth"

declare module "fastify" {
        interface FastifyRequest {
                user?: {
                        id: string
                        role: string
                        email: string
                }
        }
        interface FastifyInstance {
                authenticate: (request: any, reply: any) => Promise<void>
        }
}

export const authPlugin: FastifyPluginAsync = async (fastify) => {
        // Decorate request with user
        fastify.decorateRequest("user", undefined)

        // Add authenticate method
        fastify.decorate("authenticate", async (request: any, reply: any) => {
                if (!request.user) {
                        return reply.status(401).send({ error: "Unauthorized" })
                }
        })

        // Add hook to verify JWT on protected routes
        fastify.addHook("preHandler", async (request, reply) => {
                // Skip auth for public routes
                const publicRoutes = [
                        "/healthz",
                        "/stats/view",
                        "/artworks/:artworkId/social-proof",
                        "/artists/:artistId/social-proof",
                        "/collections",
                        "/collections/:slug",
                        "/inquiries"
                ];

                // Check if current route matches any public route pattern
                const isPublicRoute = publicRoutes.some(route => {
                        if (route.includes(":")) {
                                // Handle parameterized routes
                                const routePattern = route.replace(/:[^/]+/g, "[^/]+");
                                const regex = new RegExp(`^${routePattern}$`);
                                return regex.test(request.url);
                        }
                        return request.url === route;
                });

                if (isPublicRoute) {
                        return;
                }

                const authHeader = request.headers.authorization
                const token = authHeader?.replace("Bearer ", "") || request.cookies.token

                if (!token) {
                        return reply.status(401).send({ error: "No token provided" })
                }

                try {
                        const payload = await verifyJwt(token)
                        request.user = {
                                id: payload.id,
                                role: payload.role,
                                email: payload.email
                        }
                } catch (error) {
                        return reply.status(401).send({ error: "Invalid token" })
                }
        })

        // Role-based access control helper
        fastify.decorate("requireRole", (allowed: Role | Role[]) => {
                return async (request: any, reply: any) => {
                        if (!request.user) {
                                return reply.status(401).send({ error: "Unauthorized" })
                        }

                        const userRole = request.user.role as Role
                        const allowedRoles = Array.isArray(allowed) ? allowed : [allowed]

                        if (!allowedRoles.includes(userRole)) {
                                return reply.status(403).send({ error: "Forbidden" })
                        }
                }
        })
}
