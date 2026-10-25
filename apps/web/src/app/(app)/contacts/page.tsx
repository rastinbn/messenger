"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useContacts, useRemoveContact } from "@/hooks/useContacts";
import { useCreateConversation } from "@/hooks/useChat";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function ContactsPage() {
  const { t } = useLocale();
  const { data: contacts, isLoading } = useContacts();
  const removeContact = useRemoveContact();
  const createConversation = useCreateConversation();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!contacts) return [];
    if (!query.trim()) return contacts;
    const q = query.toLowerCase();
    return contacts.filter(
      (c) => c.displayName.toLowerCase().includes(q) || c.username.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
        <h1 className="font-display text-2xl mb-1">{t("nav.contacts")}</h1>
        <p className="text-text-secondary text-sm mb-6">{t("contacts.description")}</p>

        <Input
          placeholder={t("contacts.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t("contacts.search")}
          className="mb-6"
        />

        {isLoading && (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-text-muted text-center mt-10">{t("contacts.empty")}</p>
        )}

        <ul className="flex flex-col divide-y divide-border-subtle">
          {filtered.map((contact) => (
            <li key={contact.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
              <Link href={`/profile/${contact.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar name={contact.displayName} status={contact.status} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{contact.displayName}</p>
                  <p className="text-xs text-text-muted truncate">@{contact.username}</p>
                </div>
              </Link>
              <div className="flex items-center gap-2 shrink-0 pl-[52px] sm:pl-0">
                <Button
                  size="sm"
                  variant="secondary"
                  isLoading={createConversation.isPending}
                  onClick={() =>
                    createConversation.mutate(
                      { participantIds: [contact.id] },
                      { onSuccess: (conv) => router.push(`/chat/${conv.id}`) }
                    )
                  }
                >
                  {t("common.message")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => removeContact.mutate(contact.id)}>
                  {t("common.remove")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
