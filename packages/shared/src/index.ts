// Types
export interface Env {
	NODE_ENV: "development" | "production" | "test";
	PORT?: string;
	API_BASE_URL?: string;
	DATABASE_URL?: string;
	NEXTAUTH_URL?: string;
	NEXTAUTH_SECRET?: string;
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
	UPSTASH_REDIS_REST_URL?: string;
	UPSTASH_REDIS_REST_TOKEN?: string;
}

export interface Health {
	ok: boolean;
	uptime: number;
	env: string;
	timestamp: string;
}

// Result helpers
export type Result<T, E = Error> = 
	| { success: true; data: T }
	| { success: false; error: E };

export const createSuccess = <T>(data: T): Result<T> => ({
	success: true,
	data
});

export const createError = <E>(error: E): Result<never, E> => ({
	success: false,
	error
});

// Zod schemas
import { z } from "zod";

export const HealthSchema = z.object({
	ok: z.boolean(),
	uptime: z.number(),
	env: z.string(),
	timestamp: z.string()
});

export const EnvSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	PORT: z.string().optional(),
	API_BASE_URL: z.string().url().optional(),
	DATABASE_URL: z.string().optional(),
	NEXTAUTH_URL: z.string().url().optional(),
	NEXTAUTH_SECRET: z.string().optional(),
	GOOGLE_CLIENT_ID: z.string().optional(),
	GOOGLE_CLIENT_SECRET: z.string().optional(),
	UPSTASH_REDIS_REST_URL: z.string().url().optional(),
	UPSTASH_REDIS_REST_TOKEN: z.string().optional()
});

// Environment validation with defaults
export const env = EnvSchema.parse({
	NODE_ENV: process.env.NODE_ENV || "development",
	PORT: process.env.PORT,
	API_BASE_URL: process.env.API_BASE_URL,
	DATABASE_URL: process.env.DATABASE_URL,
	NEXTAUTH_URL: process.env.NEXTAUTH_URL,
	NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
	UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
	UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN
});

// Utility functions
export const getUptime = (): number => process.uptime();

export const getTimestamp = (): string => new Date().toISOString();

export function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "")
		.trim();
}

export const validateEnv = (env: Record<string, string | undefined>): Env => {
	return EnvSchema.parse(env);
};

// Re-export artist schemas and utilities
export * from "./schemas/artist"
export * from "./schemas/artwork"
export * from "./utils"
export * from "./constants/catalog"
export * from "./format/price"
export * from "./seo/jsonld"
