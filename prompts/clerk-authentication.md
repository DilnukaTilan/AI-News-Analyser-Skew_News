# Clerk Authentication Implementation Prompt

## Goal

Add production-appropriate Clerk authentication to the existing Biasly/Skew Next.js App Router application. Keep news browsing public, add dedicated sign-in and sign-up flows, expose clear authentication controls in the existing site header, and show Clerk's user menu after authentication.

## Skills read

- `.agents/skills/clerk/SKILL.md`
  - Detected this as a Clerk setup task.
  - Confirmed the project has no Clerk SDK installed, so use the current `@clerk/nextjs` SDK rather than a Core 2 compatibility path.
  - Follow the setup route's current-sdk rules: use `@clerk/nextjs`, keep `CLERK_SECRET_KEY` server-only, place `ClerkProvider` inside `<body>`, and use `proxy.ts` for Next.js 16.

The local Clerk router references a `clerk-setup` child skill, but that child skill is not present under `.agents/skills/clerk/`. Current official Clerk Next.js documentation was therefore consulted for the concrete setup pattern.

## Documentation inspected

- `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`
  - Next.js 16 uses the root `proxy.ts` convention; Proxy is appropriate for attaching request authentication state but is not a complete authorization layer.
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
  - App Router page/layout conventions and optional catch-all route structure.
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
  - Preserve server components by default and introduce client behavior only through Clerk components that require it.
- `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`
  - Only `NEXT_PUBLIC_*` values may be exposed to browser bundles; server secrets must remain unprefixed.
- Current official Clerk Next.js App Router quickstart and custom sign-in/sign-up page documentation.

## Existing code inspected

- `package.json`
  - Next.js `16.3.4`, React `19.2.8`, npm lockfile, no Clerk dependency.
- `app/layout.tsx`
  - Root server layout, Poppins font, metadata, and global styles; no provider currently.
- `components/layout/site-header.tsx`
  - Shared responsive header with static `Subscribe` and `Login` buttons.
- `app/page.tsx`
  - Public home page using the shared header.
- `app/news/[slug]/page.tsx`
  - Public article details page using the shared header.
- `app/globals.css`
  - Existing color, typography, spacing, radius, and focus-token system.
- `components/ui/button.tsx`
  - Existing button visual language.
- `README.md`
  - Still contains starter documentation and no authentication setup.
- `.env.example`
  - Missing and must be created without real credentials.

## Decisions and assumptions

- News home and article details remain public. Clerk's proxy attaches auth state, but no existing route is protected because the product does not yet define a private destination or authenticated-only resource.
- Use Clerk's current Next.js SDK because this is a new integration and no legacy Clerk package is installed.
- Use dedicated application routes at `/sign-in` and `/sign-up`, backed by Clerk's prebuilt components and optional catch-all segments so multi-step auth callbacks work.
- Keep `app/layout.tsx` a server component and wrap its existing body content with `ClerkProvider` inside `<body>`.
- Replace the header's static authentication affordances with state-aware Clerk controls:
  - signed out: clear `Sign up` primary action and `Log in` secondary action;
  - signed in: Clerk `UserButton` with sign-out/account management access.
- Do not add a dashboard, profile page, organization support, billing, database user synchronization, webhooks, or custom authentication form logic.
- Use Clerk's hosted/prebuilt form components rather than a bespoke credential flow.
- Prefer `npx -y clerk@latest init` for initial setup as recommended by Clerk. If it cannot complete, install and configure `@clerk/nextjs` manually using the npm package manager already selected by `package-lock.json`.
- Do not read, print, or commit real environment values. The developer supplies or links Clerk credentials through Clerk's supported setup flow.

## Files likely to change

- `package.json`
- `package-lock.json`
- `proxy.ts` (new)
- `app/layout.tsx`
- `components/layout/site-header.tsx`
- `app/sign-in/[[...sign-in]]/page.tsx` (new)
- `app/sign-up/[[...sign-up]]/page.tsx` (new)
- `.env.example` (new)
- `README.md`

Do not change news content, Supabase schema, scraping, analysis, scheduler, or unrelated UI components.

## Implementation requirements

1. Install the current `@clerk/nextjs` package using npm, preferably through the current Clerk CLI initialization flow.
2. Add a root `proxy.ts` using `clerkMiddleware()` from `@clerk/nextjs/server`.
3. Configure the proxy matcher to:
   - skip Next.js internals and ordinary static assets;
   - include application pages;
   - always include API/trpc paths for future server-side auth access;
   - include Clerk's frontend API proxy route when required by the current official matcher.
4. Do not protect all routes in the proxy. Authorization must be opted into near the resource when a protected resource is later introduced.
5. Add `ClerkProvider` inside the existing `<body>` in `app/layout.tsx`, preserving the current font, metadata, and document structure.
6. Add optional catch-all pages for `/sign-in` and `/sign-up` using Clerk's `<SignIn />` and `<SignUp />` components.
7. Center the auth component in a minimal full-height page shell that uses the existing off-white background, spacing scale, and responsive padding. Include a small link back to the news home without duplicating the full site chrome.
8. Update `SiteHeader` with Clerk's current conditional rendering components:
   - when signed out, render links/buttons for both sign-up and login;
   - when signed in, render `UserButton` with an accessible visible avatar control;
   - preserve the existing brand, topic bar, navigation, layout heights, and focus styling;
   - keep authentication usable on mobile instead of hiding the only sign-in control at small breakpoints.
9. Add placeholder-only Clerk configuration to `.env.example`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/`
10. Because `AGENTS.md` defines `.env.example` as the canonical environment-variable list, include the remaining documented server/public variable names as empty placeholders or clearly commented optional values so the file and project contract do not diverge. Never add real keys.
11. Update `README.md` with concise setup instructions: run Clerk initialization or populate `.env.local`, start the app, and verify the auth flows.
12. Keep TypeScript strict, avoid `any`, and avoid unnecessary client component boundaries.

## Visual interpretation

- Authentication should feel native to the current editorial product, not like a separate dashboard.
- Preserve the Poppins typography and the existing restrained black/off-white visual system.
- Signed-out header actions should match the current compact header proportions: dark primary sign-up action and outlined login action.
- On narrow screens, retain a compact login entry point and avoid header overflow; labels may tighten, but must remain understandable and keyboard accessible.
- Auth pages should use generous centered whitespace, a subtle surface/container treatment only if needed, and no decorative imagery.
- Clerk's prebuilt component appearance may be lightly configured to align fonts, primary black, border radius, and focus behavior while keeping its accessible defaults intact.
- No pixel-perfect redesign of the existing header is intended; auth controls should occupy approximately the same footprint as the current two actions.

## Security requirements

- Never expose `CLERK_SECRET_KEY` to client code, logs, checked-in files, or user-visible errors.
- Commit only placeholders in `.env.example`; keep actual credentials in `.env.local` or the deployment environment.
- Do not inspect or print existing environment files during implementation.
- Do not use Supabase Auth or create a parallel authentication/session system.
- Do not treat proxy matching alone as authorization. Any future sensitive server action or route must call and await Clerk's server auth helper close to the protected operation.
- Preserve all existing server-only secret boundaries for Supabase, Oxylabs, OpenAI, admin, and cron credentials.
- Avoid open redirect behavior; use local fallback redirect paths.

## Acceptance criteria

- The app builds with the current Clerk SDK on Next.js 16.3.4.
- `ClerkProvider` is mounted inside `<body>` and all existing public pages render within it.
- `/sign-in` and `/sign-up` render working Clerk flows and can handle nested multi-step paths.
- Signed-out users see both sign-up and login actions in the shared header at desktop and mobile sizes.
- Signed-in users see a user avatar/menu and can sign out.
- Completing sign-in or sign-up returns the user to `/` when no redirect target was supplied.
- Home and news-details routes remain publicly readable when signed out.
- `proxy.ts` uses the Next.js 16 convention and Clerk's current recommended matcher.
- No real credentials are committed or exposed to browser code.
- Existing header layout, topic navigation, article UI, metadata, and Poppins styling remain intact.
- TypeScript, lint, Clerk diagnostics, and production build checks complete successfully, aside from a clearly reported credential-dependent limitation if Clerk keys have not yet been configured.

## Checks to run

From the project root:

```powershell
npm run typecheck
npm run lint
npx -y clerk@latest doctor
npm run build
```

Report the exact output/result of every command. The build is required because this change affects package dependencies, the root layout, routes, and proxy configuration.

## Exact manual test steps expected after implementation

1. Create or select a Clerk application and ensure the following real values are present in `.env.local` (never commit this file):

   ```dotenv
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   CLERK_SECRET_KEY=sk_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
   ```

2. Start the application:

   ```powershell
   npm run dev
   ```

3. Open `http://localhost:3000` in a private/incognito browser window.
4. Confirm the public home page renders and both `Sign up` and `Log in` controls are visible.
5. Resize to a narrow mobile viewport and confirm an understandable auth entry point remains visible without horizontal header overflow.
6. Open `http://localhost:3000/news/<existing-demo-slug>` while signed out and confirm the public article page renders.
7. Select `Sign up`, complete account creation with the enabled Clerk strategy, and confirm the app returns to `/` with the user avatar visible.
8. Open the user menu, confirm account-management controls appear, then sign out and confirm the signed-out actions return.
9. Select `Log in`, authenticate with the created user, and confirm the app returns to `/` with the user avatar visible.
10. Directly open `http://localhost:3000/sign-in` and `http://localhost:3000/sign-up`; confirm each flow renders without routing or hydration errors.
11. Watch the `npm run dev` terminal during the flow and confirm there are no Clerk proxy, missing-key, callback-route, or hydration errors.
