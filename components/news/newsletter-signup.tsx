"use client";

import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 600);
  };

  return (
    <section
      className="mt-10 sm:mt-12 rounded-xl border border-border bg-gradient-to-b from-surface/80 via-surface/40 to-bg-primary p-5 sm:p-7 md:p-8 shadow-xs md:flex md:items-center md:justify-between md:gap-8"
      aria-labelledby="newsletter-heading"
    >
      <div className="max-w-xl">
        <h2
          id="newsletter-heading"
          className="text-lg font-bold tracking-tight text-text-primary sm:text-xl md:text-2xl"
        >
          Stay Informed. Stay Balanced.
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-text-secondary sm:text-sm">
          Get the top stories, media framing insights, and AI bias analysis
          delivered straight to your inbox.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-5 w-full md:mt-0 md:max-w-[420px] lg:max-w-[460px]"
      >
        {status === "success" ? (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs sm:text-sm text-emerald-800">
            <span>
              You&apos;re subscribed! Thanks for joining our balanced reader
              community.
            </span>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="newsletter-email">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="h-11 w-full min-w-0 sm:flex-1 rounded-lg border border-border bg-bg-primary px-4 text-sm text-text-primary placeholder:text-text-secondary/70 shadow-xs transition-all focus:border-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex h-11 w-full sm:w-auto shrink-0 items-center justify-center rounded-lg bg-text-primary px-5 text-sm font-medium text-white shadow-xs transition-all hover:bg-black active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-70"
              >
                <span>
                  {status === "loading" ? "Subscribing..." : "Subscribe"}
                </span>
              </button>
            </div>
            <p className="mt-2.5 text-[11px] text-text-secondary">
              No spam, ever. Unsubscribe with one click anytime.
            </p>
          </>
        )}
      </form>
    </section>
  );
}
