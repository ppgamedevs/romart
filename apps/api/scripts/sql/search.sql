-- Extensii necesare (o singură dată în schema public):
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Coloane tsvector + indici (nu direct prin Prisma):
ALTER TABLE "SearchItem" ADD COLUMN IF NOT EXISTS ts tsvector;
CREATE INDEX IF NOT EXISTS searchitem_ts_idx ON "SearchItem" USING GIN (ts);
CREATE INDEX IF NOT EXISTS searchitem_trgm_title_idx ON "SearchItem" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS searchitem_medium_idx ON "SearchItem"(medium);
CREATE INDEX IF NOT EXISTS searchitem_price_idx ON "SearchItem"(priceMinor);
CREATE INDEX IF NOT EXISTS searchitem_published_idx ON "SearchItem"(publishedAt);

-- Funcție de build tsvector (simplu: unaccent + simple)
CREATE OR REPLACE FUNCTION searchitem_build_ts(title text, artist text, tags text[])
RETURNS tsvector AS $$
  SELECT
    setweight(to_tsvector('simple', unaccent(coalesce(title,''))), 'A') ||
    setweight(to_tsvector('simple', unaccent(coalesce(artist,''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(array_to_string(tags,' '))), 'C');
$$ LANGUAGE SQL IMMUTABLE;

-- Recompute trigger la upsert
CREATE OR REPLACE FUNCTION searchitem_refresh_ts() RETURNS trigger AS $$
BEGIN
  NEW.ts := searchitem_build_ts(NEW.title, NEW.artistName, NEW.tags);
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_searchitem_ts ON "SearchItem";
CREATE TRIGGER trg_searchitem_ts
BEFORE INSERT OR UPDATE OF title, artistName, tags
ON "SearchItem" FOR EACH ROW
EXECUTE FUNCTION searchitem_refresh_ts();
