import { cn } from "@/lib/cn";
import type { UserStatus } from "@messenger/shared-types";
import Image from "next/image";

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: UserStatus;
  className?: string;
}

const sizeMap: Record<NonNullable<AvatarProps["size"]>, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 88
};

const statusColor: Record<UserStatus, string> = {
  online: "bg-status-online",
  away: "bg-status-away",
  dnd: "bg-status-dnd",
  offline: "bg-status-offline"
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic hue from name so the same person always gets the same
// fallback color, without needing a real avatar image.
function hueFromName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

export function Avatar({ name, src, size = "md", status, className }: AvatarProps) {
  const px = sizeMap[size];
  const hue = hueFromName(name);

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: px, height: px }}>
      {src ? (
        <Image
          src={src}
          alt={name}
          width={px}
          height={px}
          className="rounded-full object-cover w-full h-full"
        />
      ) : (
        <div
          className="rounded-full w-full h-full flex items-center justify-center font-display font-medium text-white select-none"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 40) % 360} 55% 32%))`,
            fontSize: px * 0.38
          }}
          aria-hidden
        >
          {initials(name)}
        </div>
      )}
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-bg-surface",
            statusColor[status]
          )}
          style={{ width: Math.max(10, px * 0.28), height: Math.max(10, px * 0.28) }}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}
