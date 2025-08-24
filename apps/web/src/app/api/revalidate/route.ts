import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: Request) {
  const auth = new URL(req.url).searchParams.get("secret");
  if (auth !== process.env.ON_DEMAND_REVALIDATE_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { tags = [] } = body as { tags: string[] };
  
  tags.forEach(t => revalidateTag(t));
  
  return NextResponse.json({ revalidated: true, tags });
}
