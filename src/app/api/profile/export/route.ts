import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/profile/export
// Renvoie un JSON contenant toutes les données associées au compte
// du user connecté (article 20 RGPD - portabilité des données).
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const [
    user,
    workouts,
    sessions,
    bodyWeights,
    xpEvents,
    notifications,
    categories,
    plannedSessions,
    privateMessages,
    supportMessages,
    supportThreads,
    workoutLikes,
    workoutSaves,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        usernameChangesCount: true,
        usernameLocked: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    }),
    db.workout.findMany({
      where: { authorId: userId },
      include: {
        versions: {
          include: {
            exercises: {
              include: {
                exercise: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    db.workoutSession.findMany({
      where: { userId },
      include: {
        sets: true,
        workout: { select: { name: true } },
      },
    }),
    db.bodyWeightEntry.findMany({ where: { userId } }),
    db.xpEvent.findMany({ where: { userId } }),
    db.notification.findMany({ where: { userId } }),
    db.workoutCategory.findMany({ where: { userId } }),
    db.plannedSession.findMany({ where: { userId } }),
    db.privateMessage.findMany({ where: { senderId: userId } }),
    db.supportMessage.findMany({ where: { senderId: userId } }),
    db.supportThread.findMany({ where: { userId } }),
    db.workoutLike.findMany({ where: { userId } }),
    db.workoutSave.findMany({ where: { userId } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user,
    workouts,
    sessions,
    bodyWeights,
    xpEvents,
    notifications,
    categories,
    plannedSessions,
    supportThreads,
    privateMessages,
    supportMessages,
    workoutLikes,
    workoutSaves,
  };

  const filename = `horion-export-${userId}-${Date.now()}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
