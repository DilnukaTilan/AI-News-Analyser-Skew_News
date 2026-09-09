# Skew News

Skew is a Next.js news experience that presents AI-assisted sentiment and political-framing analysis.

## Local setup

Install dependencies:

```powershell
npm install
```

Initialize Clerk with the official CLI:

```powershell
npx -y clerk@latest init
```

Alternatively, copy `.env.example` to `.env.local` and populate the Clerk publishable and secret keys from your Clerk application. Keep `.env.local` private.

Start the development server:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Signed-out users can browse news and use the header to sign up or log in. Signed-in users see their Clerk account menu.

## Checks

```powershell
npm run typecheck
npm run lint
npx -y clerk@latest doctor
npm run build
```
