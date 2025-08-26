# Prompt 29 - Recommendations & Personalization System (Updated)

## Overview
Successfully implemented a comprehensive **Recommendations & Personalization System** for RomArt, including updated components with Next.js 15 Server Components, impression tracking, and a new Discover UX feature.

## ✅ Completed Implementation

### 1. Environment Variables
Added to `env.example`:
```env
# Recommendations & Personalization
RECS_ENABLED=true
RECS_TRENDING_WINDOW_DAYS=14
RECS_MAX_PER_SECTION=16
RECS_DIVERSITY_ARTIST=true
RECS_PRICE_BAND_TOLERANCE=0.35
RECS_AB_FLAG_FORMULA=rec_formula_v2
PGVECTOR_ENABLED=false
DISCOVER_PAGE_SIZE=24
```

### 2. Database Schema (Prisma)
Added new models to `packages/db/prisma/schema.prisma`:
```prisma
enum InteractionKind {
  VIEW
  FAVORITE
  ADD_TO_CART
  PURCHASE
}

model Interaction {
  id         String           @id @default(cuid())
  userId     String?
  artworkId  String
  kind       InteractionKind
  weight     Int              @default(1)
  createdAt  DateTime         @default(now())
  
  @@index([artworkId, createdAt])
  @@index([userId, createdAt])
  @@map("interactions")
}

model SimilarArtwork {
  artworkId  String
  similarId  String
  score      Float
  createdAt  DateTime         @default(now())
  
  @@id([artworkId, similarId])
  @@index([artworkId, score])
  @@map("similar_artworks")
}

model TrendingDaily {
  day        DateTime         // YYYY-MM-DD 00:00 UTC
  artworkId  String
  score      Float
  
  @@id([day, artworkId])
  @@index([day, score])
  @@map("trending_daily")
}

model UserPreference {
  userId     String           @id
  topMediums String[]         // ["painting","photography"]
  priceP50   Int              // mediană (minor)
  updatedAt  DateTime         @updatedAt
  
  @@map("user_preferences")
}
```

### 3. API Routes

#### Core Recommendations API (`apps/api/src/routes/recommendations.ts`)
- `GET /recommendations/artwork/:id/similar` - Similar artworks (content-based + popularity)
- `GET /recommendations/artist/:id/more` - More from same artist
- `GET /recommendations/trending` - Trending artworks (engagement-based)
- `GET /recommendations/for-you` - Personalized feed (user auth required)

#### Interactions API (`apps/api/src/routes/interactions.ts`)
- `POST /interactions` - Track user interactions (VIEW, FAVORITE, ADD_TO_CART, PURCHASE)
- `GET /interactions` - Debug user interactions

#### Discover API (`apps/api/src/routes/discover.ts`)
- `GET /discover` - List artworks with filtering and sorting
  - Filters: medium (painting, drawing, photography, digital)
  - Sorting: popular, price_asc, price_desc
  - Pagination support

### 4. Scoring Logic (`apps/api/src/lib/recs/scoring.ts`)
- `jaccard()` - Set similarity for tags/colors
- `priceAffinity()` - Price range matching
- `scoreSimilar()` - Content-based + popularity scoring
- `trendingFormula()` - Engagement-based trending

### 5. Batch Jobs (`apps/api/src/jobs/recs-nightly.ts`)
- `buildSimilarAll()` - Precompute SimilarArtwork scores
- `buildTrendingDay()` - Calculate daily TrendingDaily scores

### 6. Web Components (Updated)

#### Server Components (Next.js 15)
- **`SimilarGrid`** (`apps/web/src/components/recs/SimilarGrid.tsx`)
  - Server Component with SSR + cache
  - Fetches from `/recommendations/artwork/:id/similar`
  - Includes skeleton loading states
  - Integrated impression tracking

- **`MoreFromArtist`** (`apps/web/src/components/recs/MoreFromArtist.tsx`)
  - Server Component for artist's other works
  - Excludes current artwork
  - Fetches from `/recommendations/artist/:id/more`

- **`TrendingGrid`** (`apps/web/src/components/recs/TrendingGrid.tsx`)
  - Server Component for trending artworks
  - Fetches from `/recommendations/trending`
  - Configurable title and currency

#### Client Helper
- **`SimilarGridImpressions`** (`apps/web/src/components/recs/SimilarGridImpressions.tsx`)
  - Client-side impression and click tracking
  - Emits `rec_impression` and `rec_click` events
  - Used by all recommendation grids

### 7. Discover UX Feature

#### Filter Components
- **`FilterChips`** (`apps/web/src/components/discover/FilterChips.tsx`)
  - Client-side filtering by medium (All, Painting, Drawing, Photography, Digital)
  - Sort options (Popular, Price ↑, Price ↓)
  - URL-based state management

- **`DiscoverGrid`** (`apps/web/src/components/discover/DiscoverGrid.tsx`)
  - Server Component for discover page
  - Fetches from `/discover` API
  - Includes pagination
  - Integrated impression tracking

#### Discover Page
- **`/app/discover/page.tsx`**
  - Integrates FilterChips and DiscoverGrid
  - SEO-optimized metadata
  - Responsive layout

### 8. Integration Points

#### PDP Integration (`apps/web/src/app/artwork/[slug]/page.tsx`)
- Added `SimilarGrid` and `MoreFromArtist` components
- Wrapped in Suspense with skeleton fallbacks
- Passes artwork ID, artist ID, and currency

#### Home Page Integration (`apps/web/src/app/page.tsx`)
- Added `TrendingGrid` component
- Demonstrates trending recommendations

### 9. GitHub Actions Workflow
- **`.github/workflows/recommendations-nightly.yml`**
  - Scheduled daily at 2 AM UTC
  - Runs `buildSimilarAll()` and `buildTrendingDay()`
  - Includes Slack notifications

## 🎯 Key Features

### Content-Based Recommendations
- **Similar Artworks**: Based on medium, style tags, colors, price affinity
- **Artist Diversity**: Configurable to avoid artist clustering
- **Price Band Tolerance**: ±35% price range matching

### Engagement-Based Trending
- **Interaction Weighting**: VIEW (0.1), FAVORITE (0.5), ADD_TO_CART (1.0), PURCHASE (2.0)
- **Time Window**: Configurable (default 14 days)
- **Daily Aggregation**: Precomputed trending scores

### Personalization
- **User Preferences**: Derived from interaction history
- **Medium Preferences**: Top mediums from user behavior
- **Price Preferences**: Median price from user interactions
- **Cold Start Handling**: Fallback to trending for new users

### Discover UX
- **Filtering**: By medium with visual chips
- **Sorting**: Popular (engagement-based), Price ascending/descending
- **Pagination**: Server-side with minimal UI
- **Responsive**: Mobile-first grid layout

### Analytics Integration
- **Impression Tracking**: `rec_impression` events with section and item IDs
- **Click Tracking**: `rec_click` events with artwork ID and href
- **A/B Testing Ready**: Feature flag support for formula variants

## 🔧 Technical Implementation

### Performance Optimizations
- **Server Components**: SSR with 5-minute cache
- **Precomputed Scores**: Nightly batch jobs for SimilarArtwork and TrendingDaily
- **Efficient Queries**: Indexed database queries with proper filtering
- **Lazy Loading**: Images with next/image optimization

### Error Handling
- **Graceful Degradation**: Fallback to trending when no similar items
- **Empty States**: Proper handling of no results
- **API Resilience**: Error handling in fetch functions

### Security & Privacy
- **No PII Exposure**: Only public artwork fields in responses
- **Rate Limiting**: Applied to recommendation endpoints
- **User Consent**: Respects analytics consent for tracking

## 🚀 Usage Examples

### PDP Recommendations
```tsx
<Suspense fallback={<SimilarGridSkeleton />}>
  <SimilarGrid artworkId={artwork.id} currency="EUR" />
</Suspense>

<Suspense fallback={<MoreFromArtistSkeleton />}>
  <MoreFromArtist 
    artistId={artwork.artistId} 
    excludeId={artwork.id}
    currency="EUR" 
  />
</Suspense>
```

### Home Page Trending
```tsx
<Suspense fallback={<TrendingGridSkeleton />}>
  <TrendingGrid currency="EUR" title="Trending Artworks" />
</Suspense>
```

### Discover Page
```tsx
<FilterChips />
<Suspense fallback={<TrendingGridSkeleton />}>
  <DiscoverGrid medium="painting" sort="popular" page={1} />
</Suspense>
```

## 📊 Analytics Events

### Impression Events
```javascript
track("rec_impression", {
  section: "similar" | "trending" | "for-you" | "discover",
  items: ["artwork_id_1", "artwork_id_2", ...]
});
```

### Click Events
```javascript
track("rec_click", {
  section: "similar" | "trending" | "for-you" | "discover",
  artworkId: "artwork_id",
  href: "/artwork/slug"
});
```

## 🎨 Design System

### Grid Layout
- **Responsive**: 2 cols (mobile) → 3 cols (tablet) → 4 cols (desktop)
- **Aspect Ratio**: 4:3 for artwork thumbnails
- **Hover Effects**: Subtle shadow transitions
- **Typography**: Consistent hierarchy with proper spacing

### Skeleton Loading
- **Card Skeletons**: Animated pulse with proper aspect ratios
- **Section Skeletons**: Placeholder for titles and grids
- **Consistent**: Matches actual component structure

## 🔄 Next Steps

### Immediate Testing
1. **Database Migration**: Run `pnpm -F db db:migrate && pnpm -F db db:generate`
2. **API Testing**: Start API and test recommendation endpoints
3. **Web Testing**: Start web app and verify components render correctly
4. **Integration Testing**: Test PDP and Discover page functionality

### Future Enhancements
1. **PGVector Integration**: Enable vector similarity for better recommendations
2. **A/B Testing**: Implement PostHog feature flags for formula variants
3. **User Preferences**: Build UI for users to set explicit preferences
4. **Advanced Filtering**: Add price range, year, and other filters to Discover
5. **Performance Monitoring**: Add metrics for recommendation quality and performance

## 📝 Notes

- All components use Next.js 15 Server Components for optimal performance
- Impression tracking is client-side only to respect user consent
- The system gracefully handles cold starts for new users and artworks
- Discover page provides a modern, filterable browsing experience
- Integration with existing analytics system (Prompt 28) is seamless

The implementation provides a solid foundation for personalized recommendations while maintaining performance and user privacy.
