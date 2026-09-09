import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { Chip } from "@/components/ui/chip";

const topics = [
  "World Cup",
  "IPL",
  "Social Media",
  "Business & Markets",
  "Health & Medicine",
  "Soccer",
  "Artificial Intelligence",
  "Arsenal FC",
  "Extreme Weather and Disasters",
];

function MenuIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="m8 10 4 4 4-4" />
    </svg>
  );
}

interface SiteHeaderProps {
  showTopics?: boolean;
}

export function SiteHeader({ showTopics = true }: SiteHeaderProps) {
  return (
    <header className="bg-bg-primary">
      <div className="bg-[#20201f] text-white">
        <div className="mx-auto flex h-7 max-w-app items-center justify-between px-4 text-[9px] leading-none sm:px-6 lg:text-[10px]">
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden sm:inline">Browser Extension</span>
            <span className="hidden h-3 w-px bg-white/25 sm:block" />
            <span>
              Theme: <strong className="font-medium">Light</strong>
            </span>
            <span className="hidden sm:inline">Dark</span>
            <span className="hidden sm:inline">Auto</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <time className="hidden md:inline" dateTime="2026-06-01">
              Monday, June 1, 2026
            </time>
            <span className="hidden h-3 w-px bg-white/25 md:block" />
            <span className="hidden sm:inline">Set Location</span>
            <span className="inline-flex items-center gap-1.5">
              <GlobeIcon />
              <span className="hidden sm:inline">International Edition</span>
              <ChevronIcon />
            </span>
          </div>
        </div>
      </div>

      <div className="border-b border-black/20">
        <div className="mx-auto flex h-[66px] max-w-app items-center gap-3 px-4 sm:gap-5 sm:px-6">
          <button
            type="button"
            aria-label="Open navigation menu"
            className="-ml-1 grid h-10 w-10 shrink-0 place-items-center rounded-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <MenuIcon />
          </button>

          <Link
            href="/"
            className="relative flex h-12 min-w-[68px] flex-col justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:mr-2 sm:min-w-[82px]"
            aria-label="Skew News home"
          >
            <span className="text-[27px] font-bold leading-6 tracking-[-0.04em]">
              Skew
            </span>
            <span className="ml-[50px] mt-0.5 text-[9px] leading-none text-text-secondary">
              News
            </span>
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden h-full items-stretch gap-8 lg:flex"
          >
            {[
              ["Home", "#top-news"],
              ["For You", "#top-news"],
              ["Local", "#top-news"],
              ["Blindspot", "#top-news"],
            ].map(([label, href], index) => (
              <Link
                key={label}
                href={href}
                className={`relative flex items-center text-[13px] font-medium transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  index === 0
                    ? "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-text-primary"
                    : ""
                }`}
              >
                {label}
                {label === "For You" ? (
                  <span className="absolute right-[-7px] top-[19px] h-1 w-1 rounded-full bg-bias-left" />
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Show when="signed-out">
              <SignUpButton mode="redirect">
                <button
                  type="button"
                  className="rounded-sm bg-[#20201f] px-2.5 py-2.5 text-[10px] font-medium text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:min-w-[102px] sm:px-5 sm:text-[11px]"
                >
                  Sign up
                </button>
              </SignUpButton>
              <SignInButton mode="redirect">
                <button
                  type="button"
                  className="rounded-sm bg-bg-primary px-1.5 py-2.5 text-[10px] font-medium text-text-primary transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:min-w-[96px] sm:border sm:border-black/50 sm:px-5 sm:text-[11px]"
                >
                  Log in
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9 sm:h-10 sm:w-10",
                  },
                }}
              />
            </Show>
          </div>
        </div>
      </div>

      {showTopics ? (
        <nav
          aria-label="Trending topics"
          className="border-b border-black/20 bg-[#fafaf8]"
        >
          <div className="topic-scroll mx-auto flex h-12 max-w-app items-center gap-2 overflow-x-auto px-4 sm:px-6">
            <button
              type="button"
              aria-label="Add a topic"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-bg-secondary text-lg font-light leading-none text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              +
            </button>
            {topics.map((topic) => (
              <Chip
                key={topic}
                label={topic}
                addable
                className="shrink-0 border-0 bg-[#e8e8e6] px-3 py-1 text-[10px] font-medium"
              />
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
