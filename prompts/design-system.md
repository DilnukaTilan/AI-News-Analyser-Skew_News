# Prompt: App Design System (SKEW)

## Goal

Translate the attached SKEW design-system reference into the codebase as a real,
reusable foundation: design tokens, the Poppins type scale, and a small set of UI
primitives, plus a `/design-system` showcase page that mirrors the reference so the
tokens can be visually validated. This is the styling foundation later feature pages
(home cards, news details) will build on. Display-only; no app data, no pipeline logic.

## Skills read

- `AGENTS.md` — sections 1, 5 (architecture layers), 21 (standards), 22 (checks).
- No feature skill applies (clerk/supabase/oxylabs/ai-sdk are out of scope here).
  Per AGENTS.md §3, Tailwind + shadcn-style patterns use existing project patterns
  and package docs. Tailwind v4 `@theme` is the token mechanism.

## Existing code inspected

- `app/globals.css` — Tailwind v4 (`@import "tailwindcss"` + `@theme inline`), currently
  only `--background`/`--foreground` and a dark `prefers-color-scheme` block. Font is
  Arial fallback.
- `app/layout.tsx` — loads Geist / Geist_Mono via `next/font/google`; wires font vars.
- `app/page.tsx` — placeholder `<div>Home</div>`.
- `package.json` — Next 16.2.10, React 19, Tailwind v4. No clsx / tailwind-merge / cva.
- `tsconfig.json` — path alias `@/*` -> project root.
- No `components/` or `lib/` yet.

## Decisions / assumptions

- **Font:** Replace Geist with **Poppins** via `next/font/google` (weights 400/500/600/700
  to cover Regular/Medium/SemiBold/Bold in the scale). Expose as `--font-sans`. Drop
  Geist Mono (unused by the design). Body font-family becomes the Poppins variable.
- **Light-only:** The reference is a single light theme. Remove the `prefers-color-scheme:
dark` override so tokens are deterministic; keep `#FFFFFF` bg / `#0D0D0F` text.
- **cn helper:** add `clsx` + `tailwind-merge` and a `lib/utils.ts` `cn()` (standard
  shadcn convention) so variant class merging is clean. Two tiny deps, not overbuild.
- **Components are lightweight, hand-rolled** with the tokens (no full shadcn CLI init —
  that would scaffold config/registry we don't need yet). Variants via small maps.
- **Bias colors** map to semantic tokens: left `#B42318`, center `#E5E7EB`, right `#1D4ED8`.
- Showcase page lives at `app/design-system/page.tsx` — a dev/reference surface, static.

## Files likely to change / add

- `app/globals.css` — full `@theme` token set (colors, radius, shadow, type scale
  vars); remove dark block; set Poppins body font. Add typography utility classes
  (`.text-h1`…`.text-caption`) mapping size/weight/line-height from the reference.
- `app/layout.tsx` — Poppins font, updated `<html>` var, metadata title "SKEW".
- `lib/utils.ts` — `cn()`.
- `components/ui/button.tsx` — variants: primary, secondary, outline, text; states incl.
  disabled; hover per reference.
- `components/ui/chip.tsx` — category chip with `+` affordance (and a plain variant).
- `components/ui/bias-meter.tsx` — left/center/right segmented meter with percentages
  and 0/50/100 scale ticks; props `{ left, center, right }`.
- `components/ui/badge.tsx` — small label (sentiment / framing) used on cards.
- `components/ui/article-card.tsx` — the CARD EXAMPLE: image, category·country, title,
  excerpt, bias meter, time-ago + read-time meta row, info + bookmark icons.
- `app/design-system/page.tsx` — showcase: brand, color swatches, type scale, buttons
  grid, chips, bias meter, card example, spacing/grid/shadow/radius sections.
- `package.json` / lockfile — add `clsx`, `tailwind-merge`; add `typecheck` script
  (`tsc --noEmit`) referenced by AGENTS.md §22 (currently missing).

## Token values (from reference)

- Colors: text-primary `#0D0D0F`, text-secondary `#6B7280`, surface `#F6F6F6`,
  bg-primary `#FFFFFF`, bg-secondary `#F0F0F0`, border `#E5E7EB`, divider `#E5E7EB`,
  bias-left `#B42318`, bias-center `#E5E7EB`, bias-right `#1D4ED8`, accent (text btn) `#1D4ED8`.
- Radius: sm 4px, md 8px, lg 12px, full 9999px.
- Shadow: sm `0 1px 2px rgba(0,0,0,.05)`, md `0 4px 12px rgba(0,0,0,.08)`,
  lg `0 12px 24px rgba(0,0,0,.12)`.
- Type: H1 32/700/1.2, H2 24/600/1.3, H3 20/600/1.3, H4 16/500/1.4,
  body-lg 16/400/1.6, body-md 14/400/1.6, body-sm 13/400/1.6, caption 11/400/1.4.
- Spacing: Tailwind's 4px base already matches (4/8/16/24/32/40/64 = 1/2/4/6/8/10/16).
- Grid: container max-width 1280px, 12 col, 24px gutter, 24px margin.

## Implementation requirements

- Preserve server/client boundaries: components are presentational; the showcase page is
  a Server Component. Only add `"use client"` if an interaction genuinely needs it (none
  expected — keep static).
- TypeScript, explicit prop types, no `any`. Small focused components.
- Use tokens (Tailwind classes generated from `@theme`), not hardcoded hex in components.
- Responsive: showcase and card must not overflow on mobile; card image `max-w-full`.

## Security requirements

- None touched (no secrets, no network, no browser-exposed server logic). Pure UI.

## Acceptance criteria

- `/design-system` renders every reference section with matching values.
- Poppins is the active font sitewide; type utilities match the scale.
- Buttons show primary/secondary/outline/text + disabled states with correct hover.
- Bias meter renders proportional left/center/right segments summing to 100 with labels.
- Article card matches the reference layout (image left, content right on desktop; stacked
  on mobile).
- No dark-mode flip; deterministic light theme.

## Checks to run

- `npm run typecheck` (add script), `npm run lint`, and `npm run build` (new routes/config).

## Manual test steps

1. `npm run dev`.
2. Open `http://localhost:3000/design-system` — verify colors, type scale, buttons,
   chips, bias meter, and the card example against the reference image.
3. Narrow the window to ~375px — confirm no horizontal overflow; card stacks.
4. Open `http://localhost:3000/` — confirm Poppins renders (home page can stay minimal
   for now or show a simple branded placeholder).
