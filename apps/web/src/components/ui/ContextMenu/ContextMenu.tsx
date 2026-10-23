"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { DropdownItem } from "@/components/ui/Dropdown";

export interface ContextMenuProps {
  items: DropdownItem[];
  children: React.ReactNode;
}

/** Wraps children; right-click opens a positioned menu at the cursor. */
export function ContextMenu({ items, children }: ContextMenuProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setPosition(null);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setPosition(null);
    }
    if (position) {
      document.addEventListener("mousedown", onClickOutside);
      document.addEventListener("keydown", onEscape);
    }
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [position]);

  return (
    <>
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          setPosition({ x: e.clientX, y: e.clientY });
        }}
      >
        {children}
      </div>
      {position &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: position.y, left: position.x }}
            className="fixed z-50 min-w-[180px] rounded-[var(--radius-md)] border border-border-default bg-bg-elevated shadow-xl py-1"
          >
            {items.map((item, i) => (
              <button
                key={i}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onSelect();
                  setPosition(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-bg-hover disabled:opacity-40 data-[danger=true]:text-danger"
                data-danger={item.danger}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
