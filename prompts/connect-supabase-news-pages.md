# Connect News Pages to Supabase

## Goal

Connect the `/` homepage and `/news/[slug]` details route to the existing Supabase article and analysis data. Remove runtime dependence on demo news fixtures so the single currently analyzed article is the only homepage card, links to its real UUID detail route, and renders its complete stored article and AI analysis.

## Skills read

- `.agents/skills/supabase/SKILL.md`
- Installed Next.js 16.3.4 documentation for Server Component database reads, Promise-based dynamic route params, dynamic metadata, `notFound()`, request-time rendering, and React request memoization.
- Current Supabase changelog, joins/nested tables documentation, and RLS documentation. No relevant breaking change blocks the existing tables; public Data API grants and RLS remain separate requirements and the current public read path was verified successfully.

## Existing code inspected

- `AGENTS.md`
- `app/page.tsx`
- `app/news/[slug]/page.tsx`
- `components/ui/article-card.tsx`
- `components/news/ai-summary.tsx`
- `components/news/bias-analysis.tsx`
- `components/news/source-breakdown.tsx`
- `components/news/related-stories.tsx`
- `components/news/article-actions.tsx`
- `lib/demo-news.ts`
- `lib/supabase/client.ts`
- `lib/supabase/queries/articles.ts`
- `lib/supabase/types.ts`
- `supabase/schema.sql` public read policies
- `next.config.ts`
- `package.json`
- `prompts/skew-homepage.md`
- `prompts/news-details-page-ui.md`

## Decisions and assumptions

- Use `listPublishedArticles()` on the homepage and `getPublishedArticleById()` on the details page. These queries already require `analyzed_at`, a joined analysis, and an active joined source.
- Keep the route folder name `[slug]` for compatibility, but treat its value as the article UUID. Homepage links use `/news/${article.id}`.
- Read through the anonymous Supabase client and existing RLS policies. Do not use or expose the service-role client for public page rendering.
- Force request-time rendering for both pages so newly analyzed articles appear without a redeploy or stale build-time snapshot.
- Use React `cache()` around the detail lookup so `generateMetadata()` and page rendering can share the same read during one request.
- Replace demo-only category/country metadata with information actually stored: source name and published date.
- Present the analysis as one article from one publisher. Remove claims about multiple balanced sources, source weighting, authors, captions, credits, or other data not present in Supabase.
- Render the stored neutral summary as prose. Do not invent bullet points or split it into claims the model did not return.
- Render `raw_text` safely as plain text paragraphs, splitting only on stored paragraph breaks. Never inject HTML.
- Do not show demo related stories. Hide the related section when no real related-article query result exists; implementing the pgvector similarity SQL/RPC is separate database work and is not required to make the two requested pages display the current stored article honestly.
- Preserve the existing visual system, responsive composition, header, footer, and design-system compatibility.

## Files likely to change

- `app/page.tsx`
- `app/news/[slug]/page.tsx`
- `components/ui/article-card.tsx`
- `components/news/ai-summary.tsx`
- `components/news/bias-analysis.tsx`
- `components/news/source-breakdown.tsx`
- Possibly a small server-safe presentation/date utility if sharing avoids duplication.
- `lib/demo-news.ts` and `components/news/related-stories.tsx` may remain as unused historical fixtures; production pages must not import them.

## Implementation requirements

1. Make the homepage an async Server Component and load `listPublishedArticles()`.
2. Render exactly the returned public articles, ordered by the existing query, with a clear empty state when none qualify.
3. Each homepage card must show the stored title, source name, image, published date, sentiment label, explicit `AI-estimated` framing label, left/center/right percentages, and confidence.
4. Every real card must link to `/news/<article UUID>` through accessible image and title links.
5. Extend `ArticleCard` minimally and backward-compatibly so `/design-system` remains valid.
6. Replace the detail route's demo lookup and `generateStaticParams()` behavior with `getPublishedArticleById(slug)` and `notFound()` for missing, inactive, or unanalyzed rows.
7. Generate title and description metadata from the stored title and summary.
8. Render the stored source, publication timestamp, image, raw article body, framing percentages and label, confidence, framing notes, summary, sentiment score and label, loaded terms, disclaimer, and model name.
9. Update analysis panel props to explicit production-safe primitive shapes instead of importing `FeaturedArticle` from `lib/demo-news`.
10. Make the source panel accurately describe the single publisher and link to the canonical URL when present, otherwise the original URL. External links must use safe `target="_blank"` and `rel="noreferrer"` behavior.
11. Remove all production-page rendering of demo related stories and fabricated source counts/breakdowns.
12. Keep both routes request-time fresh using the installed Next.js caching conventions for this project configuration.
13. Add no packages, API routes, database migrations, scraping, analysis mutations, or unrelated refactors.

## Security requirements

- Keep all data access in Server Components/server-only query modules.
- Use the anonymous Supabase client for public reads so existing RLS remains authoritative.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, Oxylabs credentials, admin secret, or cron secret.
- Do not query or render embeddings.
- Do not use `dangerouslySetInnerHTML`; render stored article content as React text.
- Do not add browser-side scraping, model calls, or pipeline mutations.
- Render only articles allowed by the existing active-source and analyzed-article public policies.

## Visual interpretation

- Preserve the current warm off-white canvas, three-column desktop homepage grid, two-column detail layout, Poppins typography, compact borders, political-framing colors, and responsive stacking.
- Replace demo metadata without disturbing card proportions: source and date occupy the existing compact metadata area; sentiment/framing/confidence appear as concise labels around the existing meter.
- On the detail page, retain the hero-led editorial hierarchy and sidebar cards while removing empty/fabricated fields cleanly rather than leaving visual placeholders.
- Use restrained capitalization and labels so political framing is clearly an AI estimate rather than objective truth.

## Layout, typography, spacing, and colors

- Reuse existing Tailwind tokens and spacing; introduce no new color system.
- Maintain the `max-w-app` container, 3/2/1-column homepage breakpoints, and wide detail/sidebar layout.
- Keep stored article body text at the current readable size and line height.
- Use existing `bias-left`, center, and `bias-right` treatments for percentages.
- Keep metadata and analysis labels small but readable, with visible keyboard focus on links.

## Responsiveness and accessibility

- Preserve one-column mobile, two-column tablet, and three-column desktop homepage behavior.
- Keep the detail article and analysis panels stacked on narrow screens and side-by-side only when space permits.
- Use semantic `<article>`, headings, `<time dateTime>`, lists for loaded terms, and descriptive image alt text based on the article title.
- Ensure every homepage card is keyboard-navigable and every external source link communicates its destination.
- Avoid horizontal overflow at 320px.

## Acceptance criteria

- With the current database state, `/` displays exactly one card: the one analyzed Supabase article, with no demo cards.
- The card contains every required stored card field and links to `/news/267f8f75-c77b-446a-a21b-76012f2c15e3` for the currently verified row without hardcoding that UUID.
- The real detail URL renders the stored article and complete analysis.
- `/news/peace-proposal` and unknown UUIDs render not-found behavior instead of demo content.
- Newly analyzed articles can appear on a subsequent request without rebuilding the app.
- No page claims that one article represents multiple sources or displays invented author/caption/related-story data.
- Public reads continue to respect RLS and no server secrets reach client output.
- `/design-system` still renders successfully.
- Typecheck, lint, production build, and whitespace checks pass.

## Checks to run

```powershell
npm run typecheck
npm run lint
npm run build
git diff --check
```

Also run a read-only anonymous Supabase query to confirm the expected published row count and verify the rendered homepage/detail HTML through the local server.

## Exact manual test steps expected after implementation

1. Run:

   ```powershell
   npm run dev
   ```

2. Open `http://localhost:3000/` and confirm only the analyzed Supabase article appears; no Trump/Iran or other demo cards remain.
3. Confirm the card shows its source, image, published date, sentiment, AI-estimated framing label and percentages, and confidence.
4. Activate the card title or image and confirm it opens its UUID route under `/news/`.
5. Confirm the details page shows the stored title, source, publication date, image, article body, summary, sentiment, framing label and percentages, confidence, framing notes, loaded terms, disclaimer, and model.
6. Open `http://localhost:3000/news/peace-proposal` and a random unknown UUID; both should show the not-found page.
7. Resize `/` to desktop, tablet, and 320–390px mobile widths and confirm the 3/2/1-column behavior and no horizontal overflow.
8. Resize the details page and confirm the article/sidebar stack remains readable.
9. Keyboard-tab through the real card and external source link and confirm visible focus states.
10. Open `http://localhost:3000/design-system` and confirm the existing component examples still render.

