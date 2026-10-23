"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useCreateConversation } from "@/hooks/useChat";
import { useContacts } from "@/hooks/useContacts";
import { cn } from "@/lib/cn";

export interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * The one real gap in group chat support: conversations of type "group"
 * always worked end-to-end (backend, message list, calls), but there was no
 * UI to actually create one — Contacts/Search only offered 1:1 "Message".
 */
export function NewGroupModal({ isOpen, onClose }: NewGroupModalProps) {
  const { data: contacts, isLoading } = useContacts();
  const createConversation = useCreateConversation();
  const router = useRouter();

  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function handleClose() {
    setName("");
    setSelected(new Set());
    onClose();
  }

  const canCreate = selected.size >= 2 || (selected.size >= 1 && name.trim().length > 0);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New group" size="md">
      <div className="flex flex-col gap-4">
        <Input
          label="Group name"
          placeholder="e.g. Launch Squad"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div>
          <p className="text-sm font-medium text-text-secondary mb-2">
            Add people {selected.size > 0 && `(${selected.size} selected)`}
          </p>
          <div className="max-h-64 overflow-y-auto flex flex-col divide-y divide-border-subtle rounded-[var(--radius-md)] border border-border-default">
            {isLoading && <p className="text-sm text-text-muted p-3">Loading contacts…</p>}
            {!isLoading && contacts?.length === 0 && (
              <p className="text-sm text-text-muted p-3">
                No contacts yet — add some from Search first.
              </p>
            )}
            {contacts?.map((contact) => {
              const isSelected = selected.has(contact.id);
              return (
                <button
                  key={contact.id}
                  onClick={() => toggle(contact.id)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-left hover:bg-bg-hover transition-colors",
                    isSelected && "bg-bg-elevated"
                  )}
                >
                  <Avatar name={contact.displayName} status={contact.status} size="sm" />
                  <span className="text-sm flex-1 truncate">{contact.displayName}</span>
                  <span
                    className={cn(
                      "h-4 w-4 rounded-full border-2 shrink-0",
                      isSelected ? "bg-accent-signal border-accent-signal" : "border-border-default"
                    )}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
          {selected.size === 1 && !name.trim() && (
            <p className="text-xs text-text-muted mt-2">
              With just one person, add a group name or select one more person.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            disabled={!canCreate}
            isLoading={createConversation.isPending}
            onClick={() =>
              createConversation.mutate(
                { participantIds: Array.from(selected), name: name.trim() || undefined },
                {
                  onSuccess: (conv) => {
                    handleClose();
                    router.push(`/chat/${conv.id}`);
                  }
                }
              )
            }
          >
            Create group
          </Button>
        </div>
      </div>
    </Modal>
  );
}
