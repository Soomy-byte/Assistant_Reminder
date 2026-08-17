import { z } from "zod";

const email = z
  .string()
  .trim()
  .email("Format email tidak valid.")
  .max(320)
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(10, "Kata sandi minimal 10 karakter.")
  .max(64, "Kata sandi maksimal 64 karakter.")
  .regex(/[a-z]/, "Gunakan minimal satu huruf kecil.")
  .regex(/[A-Z]/, "Gunakan minimal satu huruf besar.")
  .regex(/[0-9]/, "Gunakan minimal satu angka.");

export const registerSchema = z.object({
  displayName: z.string().trim().min(2, "Nama minimal 2 karakter.").max(120),
  email,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Kata sandi wajib diisi.").max(128),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(20, "Token reset tidak valid.").max(200),
  password: passwordSchema,
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Nama minimal 2 karakter.").max(120),
  timezone: z.string().trim().min(1).max(64).refine(isValidTimeZone, "Zona waktu tidak valid."),
  clockFormat: z.union([z.literal(12), z.literal(24)]),
  weekStartsOn: z.number().int().min(0).max(6),
  activeDays: z.array(z.number().int().min(0).max(6)).min(1, "Pilih minimal satu hari aktif."),
  sleepStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Jam tidur tidak valid."),
  sleepEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Jam bangun tidak valid."),
  maximumFocusMinutes: z.number().int().min(30).max(240),
  minimumBreakMinutes: z.number().int().min(5).max(120),
  defaultReminderMinutes: z.number().int().min(0).max(1440),
}).refine((value) => value.minimumBreakMinutes < value.maximumFocusMinutes, {
  message: "Durasi jeda harus lebih pendek dari durasi fokus.",
  path: ["minimumBreakMinutes"],
});

export type ProfileInput = z.infer<typeof profileSchema>;

export function isValidTimeZone(timezone: string) {
  try {
    Intl.DateTimeFormat("id-ID", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

export function timeToMinute(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minuteToTime(value: number) {
  const normalized = ((value % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

export function firstValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Data yang dikirim tidak valid.";
}
