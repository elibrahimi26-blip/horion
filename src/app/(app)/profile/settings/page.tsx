import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { CategoriesManager } from "@/components/profile/categories-manager";
import { RgpdSection } from "@/components/profile/rgpd-section";
import { listUserCategories } from "@/features/categories/queries";

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [user, categories] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: {
        username: true,
        bio: true,
        usernameChangesCount: true,
        usernameLocked: true,
      },
    }),
    listUserCategories(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Paramètres</h2>
      <ProfileSettingsForm user={user} />
      <CategoriesManager categories={categories} />
      <RgpdSection username={user.username} />
    </div>
  );
}
