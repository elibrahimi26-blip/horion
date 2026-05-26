import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      username: true,
      bio: true,
      usernameChangesCount: true,
      usernameLocked: true,
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Paramètres</h2>
      <ProfileSettingsForm user={user} />
    </div>
  );
}
