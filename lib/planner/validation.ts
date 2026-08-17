import { z } from "zod";
import { isValidTimeZone } from "@/lib/auth/validation";

const nullableText = (maximum: number) => z.union([z.string().trim().max(maximum), z.null()]).optional();
const nullableDateTime = z.union([z.string().datetime({ offset: true }), z.literal(""), z.null()]).optional().transform((value) => value ? new Date(value) : null);

export const taskInputSchema = z.object({
  title: z.string().trim().min(1, "Judul tugas wajib diisi.").max(200),
  description: nullableText(5000),
  estimatedDurationMinutes: z.number().int().min(5).max(1440),
  deadlineAt: nullableDateTime,
  earliestStartAt: nullableDateTime,
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  flexibility: z.enum(["FIXED", "FLEXIBLE"]).default("FLEXIBLE"),
  splittable: z.boolean().default(false),
  minimumChunkMinutes: z.number().int().min(5).max(240).nullable().optional(),
  fixedStartAt: nullableDateTime,
  goalId: z.union([z.string().uuid(), z.literal(""), z.null()]).optional(),
}).superRefine((value, context) => {
  if (value.deadlineAt && value.earliestStartAt && value.deadlineAt <= value.earliestStartAt) context.addIssue({ code: "custom", path: ["deadlineAt"], message: "Deadline harus setelah waktu mulai paling awal." });
  if (value.flexibility === "FIXED" && !value.fixedStartAt) context.addIssue({ code: "custom", path: ["fixedStartAt"], message: "Tugas tetap membutuhkan waktu mulai." });
  if (!value.splittable && value.minimumChunkMinutes) context.addIssue({ code: "custom", path: ["minimumChunkMinutes"], message: "Minimum bagian hanya berlaku untuk tugas yang boleh dipecah." });
  if (value.splittable && value.minimumChunkMinutes && value.minimumChunkMinutes > value.estimatedDurationMinutes) context.addIssue({ code: "custom", path: ["minimumChunkMinutes"], message: "Durasi minimum setiap sesi tidak boleh melebihi total durasi tugas." });
});

export const taskStatusSchema = z.object({ status: z.enum(["UNSCHEDULED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "MISSED", "CANCELLED"]) });

export const routineInputSchema = z.object({
  title: z.string().trim().min(1, "Judul rutinitas wajib diisi.").max(200),
  timezone: z.string().trim().refine(isValidTimeZone, "Zona waktu tidak valid."),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(0).max(1439),
  flexibility: z.enum(["FIXED", "FLEXIBLE"]).default("FIXED"),
}).refine((value) => value.startMinute !== value.endMinute, { path: ["endMinute"], message: "Jam selesai harus berbeda dari jam mulai." });

export const goalInputSchema = z.object({
  title: z.string().trim().min(1, "Judul target wajib diisi.").max(200),
  description: nullableText(3000),
  monthStart: z.string().regex(/^\d{4}-\d{2}-01$/, "Bulan target tidak valid."),
  targetAt: nullableDateTime,
  status: z.enum(["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"]).default("ACTIVE"),
  progress: z.number().int().min(0).max(100).default(0),
});

export const rangeQuerySchema = z.object({ from: z.string().datetime({ offset: true }), to: z.string().datetime({ offset: true }) }).refine((value) => new Date(value.to) > new Date(value.from), { path: ["to"], message: "Rentang waktu tidak valid." });
export const proposalRequestSchema = z.object({ rangeStart: z.string().datetime({ offset: true }), rangeEnd: z.string().datetime({ offset: true }) }).refine((value) => new Date(value.rangeEnd) > new Date(value.rangeStart), { path: ["rangeEnd"], message: "Rentang proposal tidak valid." });
export const scheduleBlockMoveSchema = z.object({
  startsAt: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
  endsAt: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
  revision: z.number().int().positive(),
  reminderOffsetMinutes: z.number().int().min(0).max(10080),
}).refine((value) => value.endsAt > value.startsAt, { path: ["endsAt"], message: "Jam selesai harus setelah jam mulai." });
export const brainDumpRequestSchema = z.object({ rawText: z.string().trim().min(3, "Tuliskan minimal satu rencana.").max(10000) });

export const extractedTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).nullable(),
  durationMinutes: z.number().int().min(5).max(1440),
  deadlineLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).nullable(),
  earliestStartLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  splittable: z.boolean(),
  minimumChunkMinutes: z.number().int().min(5).max(240).nullable(),
  confidence: z.number().min(0).max(1),
});
export const extractionSchema = z.object({ summary: z.string().max(500), tasks: z.array(extractedTaskSchema).max(25) });
export const confirmExtractionSchema = z.object({ brainDumpId: z.string().uuid(), tasks: z.array(extractedTaskSchema).min(1).max(25) });
