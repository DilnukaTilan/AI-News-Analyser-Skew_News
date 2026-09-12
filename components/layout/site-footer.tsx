import Link from "next/link";

function SocialIcon({ label }: { label: "x" | "linkedin" | "instagram" | "youtube" }) {
  if (label === "x") {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }

  if (label === "linkedin") {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.3a1.53 1.53 0 0 0-1.54 1.54 1.54 1.54 0 1 0 3.08 0A1.54 1.54 0 0 0 7.86 6.3z"
        />
      </svg>
    );
  }

  if (label === "instagram") {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  }

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
      />
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
            {[
              { id: "x" as const, label: "X" },
              { id: "linkedin" as const, label: "LinkedIn" },
              { id: "instagram" as const, label: "Instagram" },
              { id: "youtube" as const, label: "YouTube" },
            ].map(({ id, label }) => (
              <Link
                key={id}
                href="/"
                aria-label={`Follow Skew on ${label}`}
                className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <SocialIcon label={id} />
              </Link>
            ))}
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
