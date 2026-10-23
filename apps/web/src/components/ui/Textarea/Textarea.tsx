import { cn } from "@/lib/cn";
import { forwardRef, type TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, className, ...rest },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-[var(--radius-md)] bg-bg-elevated border border-border-default",
          "px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none",
          "focus-visible:outline-2 focus-visible:outline-accent-signal",
          error && "border-danger",
          className
        )}
        aria-invalid={!!error}
        {...rest}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
});
