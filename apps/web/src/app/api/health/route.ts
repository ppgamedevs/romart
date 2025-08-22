import { NextResponse } from "next/server";
import { getUptime, getTimestamp } from "@artfromromania/shared";

export async function GET() {
	const health = {
		ok: true,
		uptime: getUptime(),
		env: process.env.NODE_ENV || "development",
		timestamp: getTimestamp()
	};

	return NextResponse.json(health, {
		status: 200,
		headers: {
			"Cache-Control": "no-cache, no-store, must-revalidate",
			"Pragma": "no-cache",
			"Expires": "0"
		}
	});
}
