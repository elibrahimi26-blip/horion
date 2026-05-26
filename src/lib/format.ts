const RTF = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });

export function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return RTF.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return RTF.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 30) return RTF.format(-days, "day");
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatShortTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
