import { cn } from "@/lib/utils";

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  /** Show the trailing "+" add affordance. */
  addable?: boolean;
}

export function Chip({
  label,
  addable = false,
  className,
  ...props
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5",
        "text-body-sm text-text-primary border border-border",
        className,
      )}
      {...props}
    >
      {label}
      {addable && <span className="text-text-secondary leading-none">+</span>}
    </span>
  );
}
