import { NextResponse } from "next/server";
import { prisma } from "@artfromromania/db";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.t) {
      return new NextResponse("Bad request", { status: 400 });
    }

    await prisma.rumEvent.create({
      data: {
        t: body.t,
        v: body.v ?? 0,
        route: body.route ?? null,
        url: body.url ?? null,
        d: body.d ?? null
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("RUM event save failed:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
