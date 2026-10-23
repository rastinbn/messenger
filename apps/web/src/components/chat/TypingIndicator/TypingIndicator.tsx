export interface TypingIndicatorProps {
  label: string;
}

export function TypingIndicator({ label }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-1 py-1 text-xs text-text-muted" aria-live="polite">
      <span className="flex items-center gap-0.5 bg-bg-elevated rounded-full px-2.5 py-1.5">
        <Dot delay="0ms" />
        <Dot delay="150ms" />
        <Dot delay="300ms" />
      </span>
      {label}
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-text-muted animate-[typingDot_1.2s_ease-in-out_infinite]"
      style={{ animationDelay: delay }}
    />
  );
}
