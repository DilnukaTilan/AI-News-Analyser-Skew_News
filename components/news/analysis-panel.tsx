import { cn } from "@/lib/utils";

function InfoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

interface AnalysisPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function AnalysisPanel({
  title,
  children,
  className,
}: AnalysisPanelProps) {
  return (
    <section
      className={cn(
        "rounded-md border border-black/15 bg-bg-primary p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[20px] font-semibold leading-tight tracking-[-0.02em]">
          {title}
        </h2>
        <span className="text-text-secondary" aria-hidden>
          <InfoIcon />
        </span>
      </div>
      {children}
    </section>
  );
}
