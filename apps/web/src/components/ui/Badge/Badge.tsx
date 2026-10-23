import { cn } from "@/lib/cn";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "signal" | "neutral" | "danger";
  className?: string;
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  signal: "bg-accent-signal text-white",
  neutral: "bg-bg-elevated text-text-secondary border border-border-default",
  danger: "bg-danger text-white"
};

export function Badge({ children, variant = "signal", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full text-[11px] font-semibold px-1.5 h-5 min-w-5",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
