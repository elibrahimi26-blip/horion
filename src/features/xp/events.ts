import type { XpEventType } from "@prisma/client";

// Montant d'XP par type d'événement (cf. archi §6.1-6.2)
export const XP_AMOUNTS: Record<XpEventType, number> = {
  THREE_WORKOUTS_CREATED: 50,
  EMAIL_VERIFIED: 50,
  AVATAR_SET: 25,
  WORKOUT_COMPLETED: 20,
  LIKE_RECEIVED: 5,
  STREAK_BONUS: 50,
};

// Événements attribuables une seule fois par user (logique applicative,
// puisque le schéma n'a plus de contrainte unique sur (userId, type)).
export const ONE_SHOT_EVENTS: readonly XpEventType[] = [
  "THREE_WORKOUTS_CREATED",
  "EMAIL_VERIFIED",
  "AVATAR_SET",
];

export function isOneShot(type: XpEventType): boolean {
  return ONE_SHOT_EVENTS.includes(type);
}

// Libellés FR pour l'historique
export const XP_LABELS: Record<XpEventType, string> = {
  THREE_WORKOUTS_CREATED: "3 séances créées",
  EMAIL_VERIFIED: "Email vérifié",
  AVATAR_SET: "Avatar défini",
  WORKOUT_COMPLETED: "Séance terminée",
  LIKE_RECEIVED: "Like reçu",
  STREAK_BONUS: "Bonus streak",
};
