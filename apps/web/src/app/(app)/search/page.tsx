"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAddContact } from "@/hooks/useContacts";
import { useCreateConversation } from "@/hooks/useChat";
import { useUserSearch } from "@/hooks/useUsers";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function SearchPage() {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const { data: results, isFetching } = useUserSearch(query);
  const addContact = useAddContact();
  const createConversation = useCreateConversation();
  const router = useRouter();

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
        <h1 className="font-display text-2xl mb-1">{t("nav.search")}</h1>
        <p className="text-text-secondary text-sm mb-6">{t("search.description")}</p>

        <Input
          autoFocus
          placeholder={t("search.placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leadingIcon={<Search className="h-4 w-4" strokeWidth={1.8} aria-hidden />}
          aria-label={t("search.people")}
        />

        <div className="mt-6 flex flex-col divide-y divide-border-subtle">
          {isFetching &&
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full my-1" />)}

          {!isFetching && query.trim() && results?.length === 0 && (
            <p className="text-sm text-text-muted text-center mt-6">{t("search.empty", { query })}</p>
          )}

          {results?.map((person) => (
            <div key={person.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar name={person.displayName} status={person.status} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{person.displayName}</p>
                  <p className="text-xs text-text-muted truncate">@{person.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 pl-[52px] sm:pl-0">
                <Button size="sm" variant="secondary" onClick={() => addContact.mutate(person.id)}>
                  {t("common.add")}
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    createConversation.mutate(
                      { participantIds: [person.id] },
                      { onSuccess: (conv) => router.push(`/chat/${conv.id}`) }
                    )
                  }
                >
                  {t("common.message")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
