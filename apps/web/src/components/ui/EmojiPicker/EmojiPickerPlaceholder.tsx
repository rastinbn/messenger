"use client";

import { X } from "lucide-react";
import { useState } from "react";

const QUICK_EMOJI = ["😀", "😂", "😍", "👍", "🙏", "🎉", "🔥", "😢", "😮", "❤️", "👀", "✅"];

export interface EmojiPickerPlaceholderProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

/**
 * Placeholder emoji picker per spec — a real implementation (full emoji set,
 * search, skin-tone variants, recents) is a Phase 1.x follow-up. This gives
 * the interaction shape (grid, select, close) that later slots in behind.
 */
export function EmojiPickerPlaceholder({ onSelect, onClose }: EmojiPickerPlaceholderProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="w-64 rounded-[var(--radius-md)] border border-border-default bg-bg-elevated shadow-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-muted">Quick reactions</span>
        <button onClick={onClose} aria-label="Close" className="text-text-muted hover:text-text-primary">
          <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </button>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {QUICK_EMOJI.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            onMouseEnter={() => setHovered(emoji)}
            className="h-9 w-9 flex items-center justify-center rounded-[var(--radius-sm)] text-lg hover:bg-bg-hover"
            aria-label={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-text-muted mt-2 h-4">{hovered ?? ""}</p>
    </div>
  );
}
