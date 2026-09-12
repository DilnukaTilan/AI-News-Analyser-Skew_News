# Implementation Prompt: Bias Meter Adaptive Display

## Goal

Enhance the `BiasMeter` component (`components/ui/bias-meter.tsx`) and supporting styles (`app/globals.css`) so segment percentage labels adaptively switch between:
1. **Full word** (e.g., `Left 45%`, `Center 50%`, `Right 25%`)
2. **First letter** (e.g., `L 45%`, `C 50%`, `R 25%`)
3. **Just numbers** (e.g., `45%`, `50%`, `25%`)

by implementing the optimal approach combining **Character-Length Awareness** and **Fluid Responsive Padding & Sizing**.

---

## Skills Read

- `node_modules/next/dist/docs/`: Next.js App Router, Server Components conventions, responsive CSS.
- Project architectural rules in `AGENTS.md` (Workflow §2, UI and prompt rules §4).

---

## Existing Code Inspected

- `components/ui/bias-meter.tsx`: Current implementation with hardcoded `compact && s.value < 14 ? s.value + "%"` logic, where only Left received `"L"` while Center and Right always remained `"Center"` and `"Right"`, leading to text overflow/clipping in narrow segments.
- `components/ui/article-card.tsx`: Uses `<BiasMeter ... compact />` in the grid card layout and non-compact in horizontal layout.
- `app/news/[slug]/page.tsx`: Uses `<BiasMeter left={bias.left} center={bias.center} right={bias.right} />` in article analysis sidebar.
- `app/design-system/page.tsx`: Visual showcase demonstrating `BiasMeter` with `showScale`.
- `app/globals.css`: Tailwind v4 theme, typography scales, and global styles.

---

## Decisions and Assumptions

1. **Pure CSS Container Queries (`@container`) with Character-Length Thresholds**:
   - Each segment element uses `container-type: inline-size` (`bias-meter-segment`), turning each individual segment into a responsive container.
   - Because each segment knows its semantic key (`left`, `center`, `right`) and its character count (e.g., "Center 45%" is 10 chars, "Right 45%" is 9 chars, "Left 45%" is 8 chars), we assign tailored character-length thresholds per segment key.
   - This eliminates fixed arbitrary breakpoints, prevents text truncation or clipping, and responds instantaneously without JavaScript ResizeObservers or hydration mismatches.
2. **Fluid Responsive Padding & Sizing**:
   - Horizontal padding uses CSS `clamp(2px, 1.5cqi, 8px)`.
   - In tight segments (e.g., 35px), padding collapses to ~2px per side, preserving valuable inline space for text.
   - In wide segments (e.g., 200px+), padding smoothly expands up to 8px, maintaining a polished, premium aesthetic.
   - Vertical alignment uses `items-center justify-center leading-none` to prevent baseline clipping.
3. **Progressive Display Tiers**:
   - **Tier 1 (Full word)**: Rendered when the segment inline size comfortably accommodates the full label + padding.
   - **Tier 2 (First letter)**: Rendered when full word would clip but single-letter abbreviation (`L`, `C`, `R`) fits comfortably.
   - **Tier 3 (Just numbers)**: Rendered when even the letter abbreviation would clip, displaying just the percentage (`XX%`).
   - **Micro-segment cutoff**: Segments narrower than ~22px (or 0%) cleanly hide inner text to avoid overflow, while retaining a full tooltip (`title="Left 8%"`) and accessible `aria-label` on the meter.
4. **Backward Compatibility**:
   - Retain `compact?: boolean`, `showScale?: boolean`, and `className?: string`.
   - Add optional `labelFormat?: "auto" | "full" | "letter" | "number"` (defaults to `"auto"`).
   - In `compact` mode (cards), thresholds and font size adjust proportionally (`text-[10px]` vs `text-caption` 11px) with slightly tighter breakpoints.

---

## Visual Interpretation, Layout, Typography, Spacing, and Colors

- **Segment Colors**:
  - Left: `bg-bias-left` (`#B42318`), text `text-white`
  - Center: `bg-bias-center` (`#E5E7EB`), text `text-text-primary` (`#0D0D0F`)
  - Right: `bg-bias-right` (`#1D4ED8`), text `text-white`
- **Bar Dimensions**:
  - Regular mode: Height `h-[22px]`, `rounded-sm`, gap `gap-1`
  - Compact mode: Height `h-[18px]`, `rounded-sm`, gap `gap-px`
- **Typography**:
  - Regular mode: Poppins `text-caption` (11px, font-medium, leading-none)
  - Compact mode: Poppins `text-[10px]` (font-medium, leading-none)
- **Scale Ticks (`showScale`)**:
  - Text `0%`, `50%`, `100%` in `text-caption text-text-secondary mt-1`.

---

## Files Likely to Change

1. `components/ui/bias-meter.tsx` — Update component to emit multi-tier semantic spans, apply fluid container styles, data attributes for segment type, and handle character-length aware rules.
2. `app/globals.css` — Define `.bias-meter-segment` container query styles, fluid padding rules, and segment-specific display tier rules.
3. `app/design-system/page.tsx` — Expand the Bias Meter section to showcase adaptive behavior across different distribution scenarios (balanced 25/50/25, skewed 10/75/15, micro-segment 5/90/5, compact cards, and responsive container widths).

---

## Implementation Requirements

- Preserve Server Component boundaries (no unnecessary `"use client"`).
- Strict TypeScript with explicit types, no `any`.
- Segment percentage math must handle standard 0–100 integer sums.
- Zero horizontal or vertical text overflow in any segment.
- Clean tooltip (`title`) on every non-zero segment showing the full phrase.
- Preserved screen-reader accessibility via container `aria-label`.

---

## Security Requirements

- UI-only presentational changes.
- No network requests, API routes, database mutations, or secret access.

---

## Acceptance Criteria

1. On wide containers (e.g. desktop news detail page, wide design-system cards), segments with sufficient width render full words: `Left 25%`, `Center 50%`, `Right 25%`.
2. On narrower segments (or compact cards), segments that cannot fit the full word smoothly step down to first letters: `L 20%`, `C 25%`, `R 20%`.
3. On tight segments where even the letter abbreviation would clip, the segment cleanly steps down to just numbers: `15%`, `10%`.
4. Micro-segments (< ~22px) cleanly hide text without clipping or wrapping.
5. In a skewed distribution (e.g., 10% Left, 75% Center, 15% Right), each segment independently displays its optimal tier (e.g. Left shows `10%`, Center shows `Center 75%`, Right shows `R 15%`).
6. Resizing the browser or viewing at mobile (375px), tablet (768px), and desktop (1280px) smoothly transitions tiers without jitter or overflow.
7. Design system page renders clear test fixtures covering all tiers.

---

## Checks to Run

- `npm run typecheck` (`tsc --noEmit`)
- `npm run lint`
- Visual validation in browser via test URLs (`/` and `/design-system`).

---

## Exact Manual Test Steps Expected After Implementation

1. Navigate to `http://localhost:3000/design-system` in the browser.
2. Locate the **Bias Meter** section.
3. Verify the adaptive behavior across the fixtures:
   - Balanced distribution (25% / 50% / 25%)
   - Skewed distribution (10% / 75% / 15%) showing mixed tiers simultaneously
   - Asymmetric distribution with micro-segment (5% / 90% / 5%)
   - Compact card format
4. Resize browser viewport from 1280px down to 375px:
   - Verify that segments transition cleanly: Full Word → First Letter → Just Number → Hidden.
   - Verify that no segment text overflows or gets truncated with ragged cuts.
5. Navigate to `http://localhost:3000/` and verify article cards in the Top News grid render clean, legible bias meters.
