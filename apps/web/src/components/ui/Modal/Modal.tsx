"use client";

import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "full";
  className?: string;
}

const sizeClasses: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  full: "max-w-[92vw] max-h-[92vh]"
};

export function Modal({ isOpen, onClose, title, children, size = "md", className }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    dialogRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-[fadeIn_120ms_ease-out]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "w-full bg-bg-surface border border-border-default rounded-[var(--radius-lg)] shadow-2xl outline-none",
          "flex flex-col max-h-[90vh]",
          sizeClasses[size],
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
            <h2 className="font-display text-lg">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-text-muted hover:text-text-primary rounded-full h-8 w-8 flex items-center justify-center hover:bg-bg-hover"
            >
              <X className="h-4 w-4" strokeWidth={2} aria-hidden />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
