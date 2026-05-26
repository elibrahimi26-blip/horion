import Link from "next/link";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

type Thread = {
  id: string;
  lastMessageAt: Date;
  member: { id: string; username: string };
  admin: { id: string; username: string };
  messages: { body: string; senderId: string; createdAt: Date }[];
  unreadCount: number;
};

type Props = {
  thread: Thread;
  currentUserId: string;
  hrefBase: string;
};

export function ThreadListItem({ thread, currentUserId, hrefBase }: Props) {
  const otherPerson =
    thread.member.id === currentUserId ? thread.admin : thread.member;
  const lastMessage = thread.messages[0];
  const isUnread = thread.unreadCount > 0;

  return (
    <Link
      href={`${hrefBase}/${thread.id}`}
      className={cn(
        "block rounded-md border p-4 transition-colors hover:bg-accent",
        isUnread ? "border-primary/30 bg-accent/30" : "",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="font-medium">
            {otherPerson.username}
            {isUnread ? (
              <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
                {thread.unreadCount > 9 ? "9+" : thread.unreadCount}
              </span>
            ) : null}
          </p>
          {lastMessage ? (
            <p className="line-clamp-1 text-sm text-muted-foreground">
              {lastMessage.senderId === currentUserId ? "Toi : " : ""}
              {lastMessage.body}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Aucun message
            </p>
          )}
        </div>
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatRelative(thread.lastMessageAt)}
        </span>
      </div>
    </Link>
  );
}
