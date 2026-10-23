import { ConversationListPanel } from "@/components/layout/ConversationListPanel";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <ConversationListPanel />
      {children}
    </div>
  );
}
