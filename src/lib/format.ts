// Formatters centralisés (i18n FR).
// Avoid creating Intl instances per-render — déclare-les ici une fois.

// ────── Singletons ──────
const RTF = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });

const DATE_SHORT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DATE_LONG = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const DATE_MONTH_YEAR = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const DATE_TIME = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const TIME_HM = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
});

// ────── Dates ──────
function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDateShort(value: Date | string | number): string {
  return DATE_SHORT.format(toDate(value));
}

export function formatDateLong(value: Date | string | number): string {
  return DATE_LONG.format(toDate(value));
}

export function formatDateMonthYear(value: Date | string | number): string {
  return DATE_MONTH_YEAR.format(toDate(value));
}

export function formatDateTime(value: Date | string | number): string {
  return DATE_TIME.format(toDate(value));
}

export function formatShortTime(value: Date | string | number): string {
  return TIME_HM.format(toDate(value));
}

export function formatRelative(value: Date | string | number): string {
  const date = toDate(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return RTF.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return RTF.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 30) return RTF.format(-days, "day");
  return DATE_SHORT.format(date);
}

// ────── Durations ──────

// Format compteur pour timer en cours : "HH:MM:SS" si ≥ 1h, sinon "MM:SS".
export function formatDurationHMS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

// Format label de durée d'une séance terminée : "1h25" / "42 min" / "—".
export function formatDurationLabel(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h${m.toString().padStart(2, "0")}`;
  return `${m} min`;
}

// ────── Inputs ──────

// Format ISO local (sans timezone offset) pour les <input type="datetime-local">.
export function toLocalInput(value: Date | string | number): string {
  const d = toDate(value);
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}
