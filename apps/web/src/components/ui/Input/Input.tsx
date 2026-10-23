import { cn } from "@/lib/cn";
import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leadingIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leadingIcon, id, className, ...rest },
  ref
) {
  const inputId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leadingIcon && (
          <span className="absolute left-3 text-text-muted" aria-hidden>
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-10 rounded-[var(--radius-md)] bg-bg-elevated border border-border-default",
            "px-3 text-sm text-text-primary placeholder:text-text-muted",
            "focus-visible:outline-2 focus-visible:outline-accent-signal focus-visible:outline-offset-0",
            "transition-colors",
            leadingIcon && "pl-9",
            error && "border-danger",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...rest}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      )}
    </div>
  );
});
