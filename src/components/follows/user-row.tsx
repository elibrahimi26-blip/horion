import Link from "next/link";
import { FollowButton } from "@/components/follows/follow-button";

type Props = {
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    bio: string | null;
    isFollowedByViewer: boolean;
  };
  currentUserId: string;
};

export function UserRow({ user, currentUserId }: Props) {
  const initials = user.username.slice(0, 2).toUpperCase();
  const isMe = user.id === currentUserId;

  return (
    <div className="flex items-center gap-3 rounded-md border bg-card p-3">
      <Link
        href={`/u/${user.username}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
      >
        {initials}
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/u/${user.username}`}
          className="font-medium hover:underline"
        >
          {user.username}
        </Link>
        {user.bio ? (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {user.bio}
          </p>
        ) : null}
      </div>
      {!isMe ? (
        <FollowButton
          targetUserId={user.id}
          isFollowing={user.isFollowedByViewer}
        />
      ) : null}
    </div>
  );
}
