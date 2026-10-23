import { AuthGuard } from "@/components/layout/AuthGuard";
import { NavRail } from "@/components/layout/NavRail";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { ImageViewerModal } from "@/components/chat/ImageViewerModal";
import { FilePreviewModal } from "@/components/chat/FilePreviewModal";
import { CallProvider } from "@/components/call/CallProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {/* h-dvh must stay a *definite* height: as a `flex-1` item inside the
          auto-height body its 0% basis would resolve to content height, and the
          whole shell would grow with the message list instead of clipping it. */}
      <div className="flex h-dvh max-h-dvh overflow-hidden">
        <NavRail />
        <div className="flex flex-1 min-h-0 overflow-hidden pb-14 md:pb-0">{children}</div>
        <MobileTabBar />
      </div>
      <ImageViewerModal />
      <FilePreviewModal />
      <CallProvider />
    </AuthGuard>
  );
}
