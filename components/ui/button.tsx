import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "text";
type ButtonSize = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 " +
  "disabled:cursor-not-allowed disabled:opacity-100";

const sizes: Record<ButtonSize, string> = {
  sm: "text-body-sm px-3 py-1.5",
  md: "text-body-md px-4 py-2",
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-text-primary text-bg-primary hover:bg-black " +
    "disabled:bg-bg-secondary disabled:text-text-secondary",
  secondary:
    "bg-bg-primary text-text-primary border border-border hover:bg-surface " +
    "disabled:bg-bg-secondary disabled:text-text-secondary disabled:border-border",
  outline:
    "bg-transparent text-text-primary border border-border hover:border-text-primary " +
    "disabled:text-text-secondary disabled:border-border",
  text:
    "bg-transparent text-text-primary hover:text-accent " +
    "disabled:text-text-secondary",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    />
  );
}
