import { prisma } from "@artfromromania/db";

function orientation(w?:number|null,h?:number|null){
  if(!w || !h) return null;
  if (Math.abs(w-h) <= Math.min(w,h)*0.1) return "SQUARE";
  return w > h ? "LANDSCAPE" : "PORTRAIT";
}

export async function upsertSearchItem(artId:string){
  const a = await prisma.artwork.findUnique({
    where:{ id: artId },
    include:{ editions:true, artist:{ select:{ displayName:true } }, collections:{ select:{ id:true } } }
  });
  if(!a) return;

  const priceMinor = a.onSale && a.saleMinor != null ? a.saleMinor : a.priceMinor ?? null;
  const tags:string[] = [
    a.medium,
    ...new Set<string>([].concat(a.editions?.map(e=>e.kind) as any || []))
  ].filter(Boolean);

  // scor curation: featured + colecții
  const curatedScore = (a.featured ? 1 : 0) + (a.collections?.length || 0)*0.25;

  // semnale ultimele 30/90 zile
  const since30 = new Date(Date.now() - 30*864e5);
  const since90 = new Date(Date.now() - 90*864e5);
  const [views30, saves30, purchases90] = await Promise.all([
    prisma.analyticsEvent.count({ where:{ artworkId: artId, type:"VIEW_ARTWORK", ts:{ gte: since30 }}}),
    prisma.analyticsEvent.count({ where:{ artworkId: artId, type:"SAVE_ARTWORK", ts:{ gte: since30 }}}),
    prisma.analyticsEvent.count({ where:{ artworkId: artId, type:"PURCHASED", ts:{ gte: since90 }}})
  ]);

  await prisma.searchItem.upsert({
    where:{ id: artId },
    create:{
      id: a.id, kind:"ARTWORK", slug: a.slug, title: a.title,
      artistName: a.artist?.displayName || "Unknown",
      medium: a.medium as any,
      tags, priceMinor,
      widthCm: a.widthCm ?? null, heightCm: a.heightCm ?? null,
      orientation: orientation(a.widthCm, a.heightCm),
      curatedScore, views30, saves30, purchases90,
      publishedAt: a.published ? a.updatedAt : null
    },
    update:{
      slug: a.slug, title: a.title, artistName: a.artist?.displayName || "Unknown",
      medium: a.medium as any, tags, priceMinor,
      widthCm: a.widthCm ?? null, heightCm: a.heightCm ?? null,
      orientation: orientation(a.widthCm, a.heightCm),
      curatedScore, views30, saves30, purchases90,
      publishedAt: a.published ? a.updatedAt : null
    }
  });
}

export async function reindexAll(){
  const ids = await prisma.artwork.findMany({ select:{ id:true }, where:{ published:true }});
  for (const {id} of ids) await upsertSearchItem(id);
}
