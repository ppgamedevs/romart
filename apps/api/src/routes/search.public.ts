import { FastifyInstance } from "fastify";
import { prisma } from "@artfromromania/db";
import { z } from "zod";

async function expandSynonyms(raw: string) {
  const tokens = raw.split(/\s+/).map(t => t.trim().toLowerCase()).filter(Boolean);
  if (!tokens.length) return { groups: [], flat: [] };
  const rows = await prisma.searchSynonym.findMany({ where: { active: true } });
  const byCanon = new Map(rows.map(r => [r.canonical, new Set([r.canonical, ...r.variants])]));
  const byVariant = new Map<string, Set<string>>();
  for (const r of rows) for (const v of r.variants) byVariant.set(v, new Set([r.canonical, ...r.variants]));

  const groups: string[][] = [];
  for (const t of tokens) {
    const set = byCanon.get(t) || byVariant.get(t) || new Set([t]);
    const arr = Array.from(set).slice(0, parseInt(process.env.SEARCH_SYNONYM_EXPAND_LIMIT || "5", 10));
    groups.push(arr);
  }
  return { groups, flat: Array.from(new Set(groups.flat())) };
}

export default async function routes(app: FastifyInstance) {
  app.get("/public/search", async (req, res) => {
    const S = z.object({
      q: z.string().default(""),
      medium: z.string().optional(),
      priceMin: z.coerce.number().int().optional(),
      priceMax: z.coerce.number().int().optional(),
      orientation: z.enum(["PORTRAIT", "LANDSCAPE", "SQUARE"]).optional(),
      sort: z.enum(["relevance", "newest", "price_asc", "price_desc", "popularity", "minprice_asc"]).default("relevance"),
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(96).default(parseInt(process.env.SEARCH_MAX_RESULTS || "48", 10))
    });
    const q = S.parse(req.query || {});
    const skip = (q.page - 1) * q.pageSize;

    const params: any[] = [];
    let where = `WHERE "publishedAt" IS NOT NULL`;
    if (q.medium) { params.push(q.medium); where += ` AND medium = $${params.length}`; }
    if (q.orientation) { params.push(q.orientation); where += ` AND "orientation" = $${params.length}`; }
    if (q.priceMin != null) { params.push(q.priceMin); where += ` AND COALESCE("minPriceMinor","priceMinor") >= $${params.length}`; }
    if (q.priceMax != null) { params.push(q.priceMax); where += ` AND COALESCE("minPriceMinor","priceMinor") <= $${params.length}`; }

    // synonyms
    const exp = (q.q || "").trim().length ? await expandSynonyms(q.q) : { groups: [], flat: [] };
    let tsRank = "0";
    let textFilter = "";
    if (exp.groups.length) {
      // websearch_to_tsquery + unaccent pe OR-uri
      // "grup" = (t1 | s1 | s2) & (t2 | s3) ...
      const parts = exp.groups.map(g => `(${g.map(x => x.replace(/[':]/g, "")).join(" | ")})`);
      params.push(parts.join(" & "));
      const P = `$${params.length}`;
      tsRank = `ts_rank_cd(ts, websearch_to_tsquery('simple', unaccent(${P})))`;
      textFilter = ` AND ( ts @@ websearch_to_tsquery('simple', unaccent(${P})) OR title ILIKE unaccent(${P}) || '%' )`;
    }

    // scor de bază + boostScore precomputat
    const wTitle = parseFloat(process.env.SEARCH_W_TITLE || "2.0");
    const wV = parseFloat(process.env.SEARCH_W_VIEWS30 || "0.2");
    const wS = parseFloat(process.env.SEARCH_W_SAVES30 || "0.6");
    const wP = parseFloat(process.env.SEARCH_W_PURCHASES90 || "1.5");
    const wCur = parseFloat(process.env.SEARCH_W_CURATED || "1.0");

    const baseScore = `
      (${tsRank}) * ${wTitle}
      + LEAST(1.0, ln("views30"+1)/ln(100+1)) * ${wV}
      + LEAST(1.0, ln("saves30"+1)/ln(50+1))  * ${wS}
      + LEAST(1.0, ln("purchases90"+1)/ln(20+1)) * ${wP}
      + "curatedScore" * ${wCur}
    `;
    const score = `(${baseScore}) * (1 + LEAST(3.0, "boostScore"))`;

    const orderBy =
      q.sort === "newest" ? `"publishedAt" DESC NULLS LAST` :
      q.sort === "price_asc" ? `"priceMinor" ASC NULLS LAST` :
      q.sort === "price_desc" ? `"priceMinor" DESC NULLS LAST` :
      q.sort === "minprice_asc" ? `COALESCE("minPriceMinor","priceMinor") ASC NULLS LAST` :
      q.sort === "popularity" ? `"purchases90" DESC, "saves30" DESC, "views30" DESC` :
      `score DESC, "publishedAt" DESC`;

    const base = `FROM "SearchItem" ${where} ${textFilter}`;

    const total = await prisma.$queryRawUnsafe<{ count: string }[]>(`SELECT COUNT(*) AS count ${base}`, ...params);
    const items = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, slug, title, "artistName", medium, "priceMinor", "minPriceMinor", "orientation",
             ${score} AS score
      ${base}
      ORDER BY ${orderBy}
      OFFSET ${skip} LIMIT ${q.pageSize}
    `, ...params);

    res.send({ 
      page: q.page, 
      pageSize: q.pageSize, 
      total: Number(total?.[0]?.count || 0), 
      items, 
      synonyms: exp.flat 
    });
  });

  app.get("/public/search/suggest", async (req,res)=>{
    const q = String((req.query as any)?.q || "").trim();
    if (q.length < parseInt(process.env.SEARCH_SUGGEST_MIN_CHARS||"2",10)) return res.send({ items: []});

    const items = await prisma.$queryRawUnsafe<any[]>(`
      SELECT slug, title, "artistName"
      FROM "SearchItem"
      WHERE "publishedAt" IS NOT NULL
        AND ( title ILIKE unaccent($1) || '%' OR similarity(title, unaccent($1)) > 0.4 )
      ORDER BY CASE WHEN title ILIKE unaccent($1) || '%' THEN 0 ELSE 1 END, similarity(title, unaccent($1)) DESC
      LIMIT 10
    `, q);

    res.send({ items });
  });
}
