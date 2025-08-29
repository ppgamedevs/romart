-- Additional indexes for Search 2.1
-- Run this after the main search setup from run-search-sql.ts

-- Index for minPriceMinor (for sorting/filtering by "from" price)
CREATE INDEX IF NOT EXISTS searchitem_minprice_idx ON "search_items"("minPriceMinor");

-- Index for boostScore (rounded for better performance)
CREATE INDEX IF NOT EXISTS searchitem_boost_idx ON "search_items"((round(("boostScore")::numeric,2)));
