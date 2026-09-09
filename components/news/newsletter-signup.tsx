export function NewsletterSignup() {
  return (
    <section
      className="mt-12 flex flex-col gap-6 rounded-md border border-black/15 bg-bg-primary px-6 py-6 shadow-sm md:flex-row md:items-center md:justify-between lg:px-9"
      aria-labelledby="newsletter-heading"
    >
      <div>
        <h2 id="newsletter-heading" className="text-[18px] font-semibold tracking-[-0.02em]">
          Stay Informed. Stay Balanced.
        </h2>
        <p className="mt-2 text-[11px] text-text-secondary">
          Get the top stories and bias analysis delivered to your inbox.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:flex-row md:max-w-[520px]">
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          readOnly
          placeholder="Enter your email"
          className="h-11 min-w-0 flex-1 rounded-sm border border-black/45 bg-bg-primary px-4 text-[11px] placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        />
        <button
          type="button"
          className="h-11 rounded-sm bg-[#20201f] px-8 text-[11px] font-semibold text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          Subscribe
        </button>
      </div>
    </section>
  );
}
