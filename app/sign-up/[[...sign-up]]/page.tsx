import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f7f7f4] px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="mb-7 text-[26px] font-bold leading-none tracking-[-0.04em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label="Skew News home"
      >
        Skew
      </Link>
      <SignUp
        appearance={{
          variables: {
            colorPrimary: "#20201f",
            borderRadius: "8px",
            fontFamily: "var(--font-poppins)",
          },
          elements: {
            cardBox: "shadow-none",
            card: "border border-black/10 shadow-sm",
          },
        }}
      />
      <Link
        href="/"
        className="mt-6 text-[11px] font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        Back to the news
      </Link>
    </main>
  );
}
