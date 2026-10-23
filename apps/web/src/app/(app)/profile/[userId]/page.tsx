"use client";

import { useParams, useRouter } from "next/navigation";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCreateConversation } from "@/hooks/useChat";
import { useAddContact } from "@/hooks/useContacts";
import { useCurrentUser, usePublicProfile } from "@/hooks/useUsers";

const STATUS_LABEL: Record<string, string> = {
  online: "Online",
  away: "Away",
  dnd: "Do not disturb",
  offline: "Offline"
};

export default function ProfilePage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const isMe = params.userId === "me" || params.userId === currentUser?.id;

  const otherProfile = usePublicProfile(params.userId);
  const createConversation = useCreateConversation();
  const addContact = useAddContact();

  const profile = isMe ? currentUser : otherProfile.data;
  const isLoading = isMe ? !currentUser : otherProfile.isLoading;

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Skeleton className="h-40 w-80" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex-1 flex items-center justify-center text-text-muted text-sm">
        This person couldn&apos;t be found.
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-md mx-auto px-4 py-10 flex flex-col items-center text-center">
        <Avatar name={profile.displayName} status={profile.status} size="xl" />
        <h1 className="font-display text-2xl mt-4">{profile.displayName}</h1>
        <p className="text-text-muted text-sm">@{profile.username}</p>
        <Badge variant="neutral" className="mt-3">
          {STATUS_LABEL[profile.status]}
        </Badge>
        {profile.statusMessage && (
          <p className="text-sm text-text-secondary mt-3 max-w-xs">{profile.statusMessage}</p>
        )}

        {!isMe && (
          <div className="flex gap-3 mt-6">
            <Button
              isLoading={createConversation.isPending}
              onClick={() =>
                createConversation.mutate(
                  { participantIds: [profile.id] },
                  { onSuccess: (conv) => router.push(`/chat/${conv.id}`) }
                )
              }
            >
              Message
            </Button>
            <Button variant="secondary" onClick={() => addContact.mutate(profile.id)}>
              Add contact
            </Button>
          </div>
        )}

        {isMe && (
          <Button variant="secondary" className="mt-6" onClick={() => router.push("/settings")}>
            Edit profile
          </Button>
        )}
      </div>
    </main>
  );
}
