import Link from "next/link";

function SocialIcon({ label }: { label: "x" | "linkedin" | "instagram" | "youtube" }) {
  const paths = {
    x: <path d="M5 4l14 16M19 4 5 20" />,
    linkedin: (
      <>
        <path d="M7 9v10M7 5.5v.01M11 19v-6a4 4 0 0 1 8 0v6M11 9v10" />
      </>
    ),
    instagram: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="5" />
        <circle cx="12" cy="12" r="3.5" />
        <path d="M17.5 6.5h.01" />
      </>
    ),
    youtube: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="4" />
        <path d="m10 9 5 3-5 3V9z" />
      </>
    ),
  };

  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths[label]}
    </svg>
  );
}

const footerGroups = [
  { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
  {
    title: "Help",
    links: ["Help Center", "Guides", "Privacy Policy", "Terms of Service"],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#202120] text-white">
      <div className="mx-auto grid max-w-app grid-cols-2 gap-x-8 gap-y-10 px-5 py-10 sm:px-8 md:grid-cols-4 md:py-8">
        <div className="col-span-2 md:col-span-1">
          <Link
            href="/"
            className="inline-flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label="Skew News home"
          >
            <span className="text-[25px] font-bold leading-6 tracking-[-0.04em]">
              Skew
            </span>
            <span className="ml-10 text-[9px] leading-none text-white/65">News</span>
          </Link>
          <p className="mt-5 max-w-36 text-[10px] leading-[1.55] text-white/75">
            Balanced news coverage,
            <br />
            powered by AI.
          </p>
        </div>

        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="text-[11px] font-semibold">{group.title}</h2>
            <ul className="mt-2.5 space-y-1.5 text-[10px] text-white/75">
              {group.links.map((link) => (
                <li key={link}>
                  <Link
                    href="/"
                    className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="text-[11px] font-semibold">Connect</h2>
          <div className="mt-3 flex items-center gap-5 text-white/85">
            {(["x", "linkedin", "instagram", "youtube"] as const).map(
              (social) => (
                <Link
                  key={social}
                  href="/"
                  aria-label={`Follow Skew on ${social}`}
                  className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <SocialIcon label={social} />
                </Link>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto max-w-app px-5 py-3 text-[9px] text-white/65 sm:px-8">
          © 2026 Skew News. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
