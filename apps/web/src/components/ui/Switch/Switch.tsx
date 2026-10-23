import { cn } from "@/lib/cn";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Visible text rendered next to the switch. */
  label?: string;
  /** Accessible name for cases where the label lives elsewhere (e.g. a settings row). */
  ariaLabel?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, ariaLabel, disabled }: SwitchProps) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-10 rounded-full transition-colors shrink-0",
          "focus-visible:outline-2 focus-visible:outline-accent-signal focus-visible:outline-offset-2",
          checked ? "bg-accent-signal" : "bg-bg-elevated border border-border-default",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked && "translate-x-4"
          )}
        />
      </button>
      {label && <span className="text-sm text-text-primary">{label}</span>}
    </label>
  );
}
