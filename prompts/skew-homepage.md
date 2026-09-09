# Prompt: Skew Homepage

## Goal

Implement the `/` homepage for **Skew** from the user-provided reference image
`C:\Users\tilan\Downloads\homepage.png`. Reproduce the page hierarchy and visual
rhythm closely: slim dark utility bar, primary navigation, scrollable topic rail,
"Top News" heading, a responsive grid of compact news cards, and a dark multi-column
footer. This is a display-only homepage implementation; do not add scraping,
analysis, authentication, API, or database behavior.

## Skills read

- `AGENTS.md` — especially product scope, architecture separation, prompt-first
  workflow, security/code standards, and required checks.
- No feature skill applies. Clerk, Supabase, Oxylabs, and AI SDK behavior are not
  part of this visual-only task. Per `AGENTS.md`, the existing Tailwind and project
  component patterns are the source of truth for styling.
- Bundled Next.js 16.3.4 guides inspected under `node_modules/next/dist/docs/01-app/`:
  layouts and pages, Server/Client Components, CSS, images, `next/link`, and
  `next/image`. Keep the page and presentational components as Server Components
  unless real browser-side state is required.

## Existing code inspected

- `app/page.tsx` — current placeholder homepage (`Home`).
- `app/layout.tsx` — Poppins is already loaded with 400/500/600/700 weights and
  metadata already uses the Skew product name.
- `app/globals.css` — Tailwind v4 theme tokens, Poppins type utilities, neutral
  palette, bias colors, radius, shadows, and 1280px app container.
- `app/design-system/page.tsx` — existing component showcase and visual conventions.
- `components/ui/article-card.tsx` — reusable horizontal card with image, meta,
  title, excerpt, framing meter, and secondary metadata.
- `components/ui/bias-meter.tsx` — reusable proportional left/center/right bar with
  a compact label mode.
- `components/ui/button.tsx` and `components/ui/chip.tsx` — existing button and topic
  chip primitives.
- `lib/utils.ts` — current class-name utility.
- `next.config.ts` — no image remote patterns configured.
- `package.json` — Next 16.3.4, React 19.2.8, Tailwind 4; `typecheck` script is missing.
- `prompts/design-system.md` — decisions that established the current tokens and UI
  primitives.
- `C:\Users\tilan\Downloads\homepage.png` — the visual reference itself.

## Decisions and assumptions

- **Brand:** follow the user request and render **Skew**, even though the supplied
  screenshot contains the earlier "biasly" wordmark.
- **Scope:** reproduce the visual composition, density, and responsive behavior;
  controls without existing product behavior remain honest links/buttons and are not
  wired to fake state or backend mutations.
- **Data:** the repository has no Supabase package, configuration, schema, or article
  query layer. Use a small typed in-module demo article collection strictly as
  presentational fixture content for this UI scaffold. Do not create a local JSON
  persistence layer. Keep its shape compatible with eventual stored article fields
  (id/slug, title, category, location, image, source count, framing percentages).
- **Images:** use stable HTTPS editorial-style image URLs with descriptive alt text
  through plain responsive image markup, following the existing `ArticleCard`
  convention, so no broad Next.js remote-host allowlist is introduced. Preserve an
  attractive neutral fallback if a remote image does not load. Do not copy or crop
  the reference screenshot into production assets.
- **Card reuse:** extend `ArticleCard` with a compact vertical/grid presentation
  rather than duplicating the card. Preserve the current horizontal design-system
  example and public props. Add only optional props needed by the homepage, such as
  `variant`, `sourceCount`, and an optional destination.
- **Framing language:** the screenshot uses `L / Center / Right`. Include accessible
  text identifying this as AI-estimated political framing, while keeping the visible
  compact meter faithful to the reference.
- **Navigation:** render semantic links for the visible navigation and footer.
  Destinations not implemented yet may use safe placeholders or the homepage without
  implying functioning routes. Active Home state receives the thin underline.
- **No unnecessary client boundary:** topic overflow should use native horizontal
  scrolling. Menu, theme, location, subscribe, and login controls are visual for this
  task; do not add `useState` solely to simulate behavior.

## Visual interpretation

- Canvas is warm off-white/light gray with a centered content column and generous
  side gutters.
- A ~28px charcoal utility strip sits at the top. Left side has browser-extension and
  light/dark/auto labels; right side has date, location, globe/edition, and chevron.
- The main white nav is ~64px tall with a hamburger, bold Skew/News wordmark, four
  section links, then dark Subscribe and outlined Login actions aligned right.
- A bordered topic rail sits below the nav with pill chips, compact spacing, plus
  affordances, and horizontal overflow rather than wrapping.
- Main content begins with a bold ~28–32px "Top News" heading, followed by twelve
  cards in a three-column desktop grid with ~24px column and row gaps.
- Cards use a 16:9 editorial image above a dense white content panel, an info icon in
  the image's upper-right corner, small category/location metadata, a bold two- or
  three-line headline, compact three-part framing meter, and source count at the
  bottom. Borders are subtle, corners are medium, and shadows are nearly flat.
- The footer spans full width in near-black, with brand and tagline at left plus
  Company, Help, and Connect groups. A divider separates the copyright row.

## Layout, typography, spacing, and colors

- Reuse the existing Poppins type scale and semantic theme tokens wherever possible.
- Keep the homepage content at `max-width: 1280px`; use approximately 24px desktop
  gutters and 16px mobile gutters.
- Desktop grid: 3 equal columns. Tablet: 2 columns. Mobile: 1 column.
- Cards within a row should feel uniform without forcing titles to clip. The image
  aspect ratio remains stable and the metadata panel fills naturally.
- Use current semantic colors for left (`bias-left`), center (`bias-center`), and
  right (`bias-right`). Keep center meter text dark and side meter text white.
- Use current `border`, `surface`, `bg-primary`, `text-primary`, and `text-secondary`
  tokens. Add narrowly scoped tokens/styles only if the screenshot requires a dark
  utility/footer surface not represented today.
- Preserve visible keyboard focus, adequate button hit areas, semantic landmarks,
  sufficient color contrast, and descriptive image alt text.

## Responsiveness

- At desktop widths, match the reference's full utility bar, horizontal main nav,
  three-column grid, and four-part footer.
- At tablet widths, retain the topic scroller and switch the card grid to two columns;
  allow secondary navigation/actions to compact without collision.
- At phone widths, hide low-priority utility text, keep the hamburger + Skew brand +
  essential action area readable, allow nav/topics to scroll or simplify, use a
  single-column card grid, and stack footer groups cleanly.
- No horizontal page overflow at 320px. The topic rail may scroll internally.

## Files likely to change or add

- `app/page.tsx` — compose the complete homepage and typed display fixtures.
- `app/globals.css` — only small global additions required for exact page surfaces or
  scrollbar behavior; retain the existing design-system tokens.
- `components/ui/article-card.tsx` — add the backward-compatible compact grid variant
  and source-count/footer treatment.
- `components/ui/bias-meter.tsx` — only if a small accessibility or compact-height
  adjustment is necessary; preserve existing behavior.
- `components/layout/site-header.tsx` — utility bar, primary nav, and topic rail.
- `components/layout/site-footer.tsx` — responsive footer and social links/icons.
- `package.json` — add the required `typecheck` script (`tsc --noEmit`) because the
  repository workflow requires it and it is currently absent.
- `next.config.ts` should remain unchanged unless the implementation switches to
  `next/image` with a narrowly scoped, explicitly required remote pattern.

## Implementation requirements

- TypeScript with explicit prop/data types and no `any`.
- Keep the homepage and static layout components as Server Components.
- Use semantic elements (`header`, `nav`, `main`, `section`, `article`, `footer`) and
  accessible names for icon-only controls.
- Use `next/link` for genuine internal navigation targets.
- Reuse existing `Button`, `Chip`, `ArticleCard`, and `BiasMeter` primitives where
  their semantics fit; do not duplicate them in page markup.
- Inline SVG icons are acceptable and should be small, reusable, and `aria-hidden`
  when a surrounding label already supplies the accessible name.
- Keep fixture/article content separate from rendering code within the page module or
  a small typed UI-only module; do not introduce persistence or pipeline work.
- Do not add a heavy icon library, carousel package, state library, or component
  framework.
- Do not modify the `/design-system` page except where a backward-compatible prop
  change requires a small update.

## Security requirements

- No secrets, environment variables, route handlers, external mutations, scraping,
  or AI calls.
- Do not expose or introduce Supabase service-role, Oxylabs, OpenAI, Clerk, admin, or
  cron credentials.
- Remote images are display-only; do not broaden `next/image` host access without a
  specific hostname requirement.
- No unsafe HTML injection.

## Acceptance criteria

- `/` closely matches the supplied reference's hierarchy, proportions, typography,
  spacing, card density, framing bars, and footer while consistently using Skew
  branding.
- Desktop at ~1440–1536px shows a centered three-column grid of twelve cards.
- Tablet shows two columns and mobile shows one column without page overflow.
- Header has the dark utility row, primary nav with active Home state and actions,
  and a horizontally scrollable chip rail.
- Every card shows image/fallback, category and location, headline, info affordance,
  AI-estimated left/center/right percentages that total 100, and source count.
- Footer matches the dark reference structure and responds cleanly on mobile.
- Existing `/design-system` rendering remains intact.
- No console errors, invalid DOM nesting, or avoidable accessibility failures.

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build` because the root page and shared components change

Report the exact outputs; do not claim success without running each command.

## Exact manual test steps expected after implementation

1. Run `npm run dev` from `E:\Projects\skew_news`.
2. Open `http://localhost:3000/`.
3. At ~1440px width, compare against
   `C:\Users\tilan\Downloads\homepage.png`: confirm three header tiers, 3-column
   card grid, card proportions, framing colors, spacing, and footer structure.
4. Resize to ~768px and confirm a 2-column card grid, usable navigation, horizontally
   scrollable topic rail, and no page overflow.
5. Resize to 320–390px and confirm a 1-column grid, readable header/actions, internal
   topic scrolling, stacked footer, and no clipped card text or meter labels.
6. Keyboard-tab through links/buttons and confirm every interactive control has a
   visible focus indicator and icon-only controls have accessible labels.
7. Open `http://localhost:3000/design-system` and confirm its existing horizontal
   article-card example and design tokens still render correctly.
