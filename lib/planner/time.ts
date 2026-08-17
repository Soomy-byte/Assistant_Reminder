export type LocalDateParts = { year: number; month: number; day: number; hour: number; minute: number };
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timezone: string) {
  let value = formatters.get(timezone);
  if (!value) {
    value = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    formatters.set(timezone, value);
  }
  return value;
}

export function zonedParts(date: Date, timezone: string) {
  const values = Object.fromEntries(formatter(timezone).formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  return { year: values.year, month: values.month, day: values.day, hour: values.hour, minute: values.minute, second: values.second };
}

export function localDateTimeToUtc(parts: LocalDateParts, timezone: string) {
  const target = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  let guess = target;
  for (let index = 0; index < 4; index += 1) {
    const shown = zonedParts(new Date(guess), timezone);
    const difference = target - Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute);
    if (!difference) break;
    guess += difference;
  }
  const result = new Date(guess);
  const shown = zonedParts(result, timezone);
  if (shown.year !== parts.year || shown.month !== parts.month || shown.day !== parts.day || shown.hour !== parts.hour || shown.minute !== parts.minute) throw new Error("Waktu lokal tidak tersedia pada zona waktu yang dipilih.");
  return result;
}

export function parseLocalDateTime(value: string, timezone: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Format waktu lokal tidak valid.");
  return localDateTimeToUtc({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]), hour: Number(match[4]), minute: Number(match[5]) }, timezone);
}

export function localDateKey(date: Date, timezone: string) { const p = zonedParts(date, timezone); return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`; }
export function addDateKeyDays(key: string, days: number) { const [y, m, d] = key.split("-").map(Number); const date = new Date(Date.UTC(y, m - 1, d + days)); return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`; }
export function dateKeyWeekday(key: string) { const [y, m, d] = key.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }
export function minuteParts(key: string, minute: number): LocalDateParts { const [year, month, day] = key.split("-").map(Number); return { year, month, day, hour: Math.floor(minute / 60), minute: minute % 60 }; }
