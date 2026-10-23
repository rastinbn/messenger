import { create } from "zustand";

interface UiState {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;

  isMobileConversationListOpen: boolean;
  setMobileConversationListOpen: (open: boolean) => void;

  draftsByConversation: Record<string, string>;
  setDraft: (conversationId: string, text: string) => void;

  isSidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;

  imageViewer: { url: string; fileName: string } | null;
  openImageViewer: (image: { url: string; fileName: string }) => void;
  closeImageViewer: () => void;

  filePreview: { id: string; fileName: string; mimeType: string; sizeBytes: number; url: string } | null;
  openFilePreview: (file: { id: string; fileName: string; mimeType: string; sizeBytes: number; url: string }) => void;
  closeFilePreview: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id, isMobileConversationListOpen: false }),

  isMobileConversationListOpen: true,
  setMobileConversationListOpen: (open) => set({ isMobileConversationListOpen: open }),

  draftsByConversation: {},
  setDraft: (conversationId, text) =>
    set((s) => ({ draftsByConversation: { ...s.draftsByConversation, [conversationId]: text } })),

  isSidebarCollapsed: false,
  toggleSidebarCollapsed: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),

  imageViewer: null,
  openImageViewer: (image) => set({ imageViewer: image }),
  closeImageViewer: () => set({ imageViewer: null }),

  filePreview: null,
  openFilePreview: (file) => set({ filePreview: file }),
  closeFilePreview: () => set({ filePreview: null })
}));
