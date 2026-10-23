import { Compass } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 gap-3">
      <Compass className="h-11 w-11 text-text-muted" strokeWidth={1.5} aria-hidden />
      <h1 className="font-display text-2xl">Page not found</h1>
      <p className="text-text-secondary text-sm max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link href="/">
        <Button className="mt-2">Back to home</Button>
      </Link>
    </main>
  );
}
