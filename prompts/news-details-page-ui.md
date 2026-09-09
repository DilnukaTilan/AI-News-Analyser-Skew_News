# Prompt: Skew News Details Page UI

## Goal

Implement a responsive Skew news-details page based on the user-provided reference
image `C:\Users\tilan\Downloads\news-details-page.png`. Add a real App Router detail
route for the featured homepage story and reproduce the reference hierarchy: article
header and actions, hero image and caption, framing distribution, readable article
body, related stories, right-hand Bias Analysis / AI Summary / Source Breakdown
panels, newsletter subscription band, and the existing site footer.

This task is display-only. Do not add scraping, AI calls, APIs, authentication, or
database behavior.

## Skills read

- `AGENTS.md` — product scope, website/data boundary, prompt-first workflow, UI
  requirements, political-framing terminology, security standards, and checks.
- No project feature skill applies. Clerk, Supabase, Oxylabs, and AI SDK behavior are
  outside this visual-only implementation. Per `AGENTS.md`, use current Tailwind and
  component patterns.
- Bundled Next.js 16.3.4 App Router documentation under
  `node_modules/next/dist/docs/01-app/`, including layouts/pages, dynamic segments,
  Promise-based `params`, Server/Client Components, links, CSS, and images.

## Existing code inspected

- `app/page.tsx` — responsive homepage and typed visual article fixtures.
- `app/layout.tsx` — Poppins and Skew metadata.
- `app/globals.css` — Tailwind v4 theme and typography/color/radius/shadow tokens.
- `components/layout/site-header.tsx` — utility bar, primary navigation, and topic
  rail currently rendered together.
- `components/layout/site-footer.tsx` — responsive Skew footer.
- `components/ui/article-card.tsx` — horizontal and grid card variants.
- `components/ui/bias-meter.tsx` — proportional left/center/right framing bar.
- `components/ui/button.tsx`, `components/ui/chip.tsx`, and `lib/utils.ts`.
- `package.json` — required typecheck, lint, and build commands already present.
- `prompts/skew-homepage.md` — approved assumptions for Skew branding, fixture data,
  accessibility, image handling, and Server Components.
- `C:\Users\tilan\Downloads\news-details-page.png` — visual reference.

## Decisions and assumptions

- **Route:** use `app/news/[slug]/page.tsx`, with the featured story available at
  `/news/peace-proposal`. Use the Next.js 16 Promise-based `params` shape and
  `notFound()` for unknown slugs.
- **Navigation:** make the featured homepage card link to this valid detail page.
  Other homepage cards remain presentational until they receive complete detail
  fixtures; do not link them to fabricated or broken pages.
- **Shared fixture:** move the featured article's typed display data into a small
  shared UI fixture module so the homepage and details page cannot drift. This is
  temporary display content, not local JSON persistence. The module may include the
  full body, analysis, source breakdown, and related stories needed by this page.
- **Brand:** keep **Skew** consistently, replacing the old "biasly" wordmark shown in
  the reference.
- **Header:** reuse `SiteHeader` with an optional `showTopics` prop. Homepage remains
  unchanged by default; the details page passes `showTopics={false}` to match the
  reference.
- **Political-framing terminology:** visible titles may say "Bias Analysis" where
  the reference does, but supporting/accessibility copy must identify the output as
  **AI-estimated political framing**, not objective truth.
- **Buttons/forms:** Save, Share, overflow, feedback, source-list, subscribe, and
  email controls are visual/semantic only in this task. Do not simulate persistence,
  sharing, feedback submission, or subscription. Use `type="button"`; the newsletter
  field may be read-only or paired with a non-submitting button.
- **Sidebar:** use normal document flow on mobile and a top-aligned or sticky sidebar
  only at wide widths where it does not obscure content.
- **Images:** continue the established stable HTTPS `<img>` approach with descriptive
  alt text and neutral fallbacks. Do not broaden Next.js image configuration.
- **No unnecessary client boundary:** all content can render as Server Components.

## Visual interpretation

- The reference has the dark utility strip and white primary nav, but no topic-chip
  rail on the detail page.
- Main content uses a centered ~1280px shell and a wide two-column desktop layout:
  approximately two-thirds article column and one-third analysis sidebar, separated
  by a 40–48px gutter.
- Article header includes small category/location metadata, a large two-line title,
  compact author/date/read-time metadata, and Save / bookmark / Share / overflow
  actions aligned to the right.
- Hero image is wide, roughly 16:9, subtly rounded, followed by a muted two-line
  caption/credit.
- Bias Distribution is a bordered white panel with a label + info icon, full-width
  segmented left/center/right meter, and source count.
- Article copy is large enough for comfortable reading, with generous paragraph
  spacing and a sensible line length.
- Related Stories is separated by a thin rule and rendered as a two-column grid of
  six compact media objects (thumbnail, metadata, headline, date, read time).
- Sidebar consists of three stacked bordered cards:
  - Bias Analysis: dominant label/percentage, source support copy, three row meters,
    methodology copy, outlined action.
  - AI Summary: generated date/read time, five bullet points, mistake disclaimer,
    outlined feedback action.
  - Source Breakdown: total count, three distribution rows, source/bias table, and
    outlined view-all action.
- A bordered newsletter band spans both columns above the footer, with copy on the
  left and email/button controls on the right.
- Existing dark Skew footer closes the page.

## Layout, typography, spacing, and colors

- Reuse the current Poppins scale and semantic tokens.
- Page background: warm near-white (`#f7f7f4` or existing surface token).
- Main shell: `max-width: 1280px`, 16px mobile gutters and 24px+ desktop gutters.
- Desktop content: approximately `minmax(0, 2fr) minmax(300px, 0.85fr)` with a
  36–44px gap. Switch to one column before the sidebar becomes cramped.
- Title: bold ~36–42px desktop, ~28–32px mobile, tight leading/tracking.
- Article body: ~16px with ~1.6 line height and 22–28px paragraph gaps.
- Panel headings: ~20–22px semibold. Supporting metadata: 10–12px muted.
- Cards: white/near-white fill, subtle neutral border, 6–8px radius, minimal shadow.
- Political framing colors must use `bias-left`, `bias-center`, and `bias-right`.
- Sidebar bar rows should show label, percentage/count, and a small horizontal
  position/proportion indicator, with sufficient contrast.

## Responsiveness

- Desktop (~1200px+): wide article column and right sidebar; sidebar panels stacked;
  related stories use two columns; newsletter content is horizontal.
- Tablet: collapse to one main column if the sidebar would be too narrow; place the
  analysis panels after the primary article/related content in a responsive grid or
  vertical stack.
- Mobile (320–390px): one column, smaller title, hero full width, article actions
  wrap cleanly, bias labels remain readable, related stories become one column,
  sidebar cards and newsletter stack, and no horizontal overflow.
- Preserve the homepage's existing responsive behavior and `/design-system` page.

## Files likely to change or add

- `app/news/[slug]/page.tsx` — dynamic details route, metadata/static params if
  appropriate, page composition, and unknown-slug handling.
- `lib/demo-news.ts` — typed shared featured story plus detail-only fixture fields.
- `app/page.tsx` — consume shared featured summary and pass a valid `href` only for
  the story with implemented details.
- `components/ui/article-card.tsx` — add optional accessible title/image link support
  without changing non-linked cards or the design-system example.
- `components/layout/site-header.tsx` — optional topic-rail visibility while
  preserving homepage defaults.
- `components/news/article-actions.tsx` — compact semantic visual actions.
- `components/news/analysis-panel.tsx` — shared bordered panel shell/info treatment.
- `components/news/bias-analysis.tsx` — overall framing and distribution rows.
- `components/news/ai-summary.tsx` — generated summary bullets and disclaimer.
- `components/news/source-breakdown.tsx` — total/distribution/source list.
- `components/news/related-stories.tsx` — responsive related-story list.
- `components/news/newsletter-signup.tsx` — non-submitting display-only signup band.
- `app/globals.css` — only if a narrowly scoped shared visual utility is needed.

Exact component boundaries may be consolidated when a component would otherwise be
trivial, but avoid one oversized page file and avoid unnecessary abstractions.

## Implementation requirements

- TypeScript with explicit types and no `any`.
- Dynamic route must follow Next.js 16 conventions (`params` is a Promise).
- Keep the page and presentational components as Server Components.
- Use semantic landmarks, headings in logical order, lists/tables where appropriate,
  `<time dateTime>`, descriptive image alt text, and accessible labels for icon-only
  controls.
- Use `next/link` for the featured homepage-to-detail navigation and related stories
  only when a valid target exists.
- Reuse `SiteHeader`, `SiteFooter`, `BiasMeter`, and current Button styling patterns.
- Percentages must be integers 0–100 and total exactly 100. The featured story stays
  at 20% left, 31% center, 49% right and 12 sources, matching the reference.
- Render the complete analysis requested by `AGENTS.md`: summary, sentiment when
  available in the fixture, framing percentages, confidence, framing notes, loaded
  terms, and disclaimer. The screenshot's sidebar can be extended subtly below its
  core content to include these required fields without disrupting the visual match.
- Do not add packages, backend routes, persistent state, or fake async behavior.
- Keep remote image failures visually graceful.

## Security requirements

- No credentials, environment variables, API routes, external mutations, scraping,
  model calls, form submission, or database access.
- Do not expose or introduce Supabase service-role, Clerk, Oxylabs, OpenAI, admin, or
  cron secrets.
- No `dangerouslySetInnerHTML`; article body is structured typed text.
- Do not transmit email, feedback, or share data because those integrations are not
  in scope.

## Acceptance criteria

- `/news/peace-proposal` closely matches the supplied reference at desktop width.
- The page includes the complete header, article header/actions, hero/caption, bias
  distribution, full article text, related stories, three analysis sidebar panels,
  newsletter band, and footer.
- The featured homepage article provides a valid, keyboard-accessible link to the
  detail route; non-implemented cards do not lead to 404 pages.
- The header topic rail remains present on `/` and is absent on the details page.
- Political framing is visibly or accessibly identified as AI-estimated.
- Detail content stacks cleanly at tablet/mobile widths with no horizontal overflow.
- All images have descriptive alt text or appropriate decorative treatment.
- Unknown `/news/<slug>` paths render Next.js not-found behavior.
- Existing homepage and `/design-system` remain visually and functionally intact.
- No console errors, broken images, invalid nesting, or avoidable accessibility
  failures.

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build` because a dynamic route and shared components are added
- `git diff --check`

Report exact outputs; do not claim success without running the commands.

## Exact manual test steps expected after implementation

1. Run `npm run dev` from `E:\Projects\skew_news`.
2. Open `http://localhost:3000/` and activate the featured "Trump Sends Iran Revised
   Peace Proposal..." card; confirm it navigates to
   `http://localhost:3000/news/peace-proposal`.
3. At ~1440px width, compare the detail page to
   `C:\Users\tilan\Downloads\news-details-page.png`: verify the header without topic
   rail, two-column article/sidebar proportions, typography, hero, analysis cards,
   related stories, newsletter band, and footer.
4. Resize to ~768px and verify the article and analysis panels stack without cramped
   columns or overflow.
5. Resize to 320–390px and verify title/action wrapping, readable framing meters,
   single-column related stories, stacked sidebar/newsletter, and no horizontal page
   overflow.
6. Keyboard-tab through the page and confirm visible focus indicators on the featured
   card link, header/footer links, article actions, and panel/newsletter buttons.
7. Open `http://localhost:3000/news/unknown-story` and confirm the not-found page.
8. Recheck `http://localhost:3000/` and `http://localhost:3000/design-system` for
   regressions.
