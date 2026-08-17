-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('DRAFT', 'UNSCHEDULED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Flexibility" AS ENUM ('FIXED', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('TASK', 'ROUTINE', 'BREAK', 'PERSONAL');

-- CreateEnum
CREATE TYPE "BlockStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'MISSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskSource" AS ENUM ('MANUAL', 'AI_BRAIN_DUMP');

-- CreateEnum
CREATE TYPE "BlockSource" AS ENUM ('MANUAL', 'SCHEDULER', 'RESCHEDULE');

-- CreateEnum
CREATE TYPE "BrainDumpStatus" AS ENUM ('PENDING', 'PROCESSING', 'REVIEW', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationJobStatus" AS ENUM ('SCHEDULED', 'PROCESSING', 'SENT', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "displayName" VARCHAR(120),
    "passwordHash" VARCHAR(255),
    "emailVerifiedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Jakarta',
    "locale" VARCHAR(16) NOT NULL DEFAULT 'id-ID',
    "weekStartsOn" INTEGER NOT NULL DEFAULT 1,
    "clockFormat" INTEGER NOT NULL DEFAULT 24,
    "activeDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "sleepStartMinute" INTEGER NOT NULL DEFAULT 1320,
    "sleepEndMinute" INTEGER NOT NULL DEFAULT 360,
    "maximumFocusMinutes" INTEGER NOT NULL DEFAULT 120,
    "minimumBreakMinutes" INTEGER NOT NULL DEFAULT 15,
    "defaultReminderMinutes" INTEGER NOT NULL DEFAULT 15,
    "productiveWindows" JSONB,
    "onboardingCompletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(5000),
    "estimatedDurationMinutes" INTEGER NOT NULL,
    "deadlineAt" TIMESTAMPTZ(3),
    "earliestStartAt" TIMESTAMPTZ(3),
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "flexibility" "Flexibility" NOT NULL DEFAULT 'FLEXIBLE',
    "splittable" BOOLEAN NOT NULL DEFAULT false,
    "minimumChunkMinutes" INTEGER,
    "preferredWindows" JSONB,
    "status" "TaskStatus" NOT NULL DEFAULT 'UNSCHEDULED',
    "source" "TaskSource" NOT NULL DEFAULT 'MANUAL',
    "aiConfidence" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Routine" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "timezone" VARCHAR(64) NOT NULL,
    "recurrence" JSONB NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "flexibility" "Flexibility" NOT NULL DEFAULT 'FIXED',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineOccurrence" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "routineId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "sourceTimezone" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoutineOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleBlock" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "taskId" UUID,
    "routineOccurrenceId" UUID,
    "scheduleVersionId" UUID,
    "title" VARCHAR(200) NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "blockType" "BlockType" NOT NULL,
    "flexibility" "Flexibility" NOT NULL DEFAULT 'FLEXIBLE',
    "status" "BlockStatus" NOT NULL DEFAULT 'PLANNED',
    "reminderOffsetMinutes" INTEGER,
    "source" "BlockSource" NOT NULL DEFAULT 'MANUAL',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ScheduleBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleVersion" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "reason" VARCHAR(120) NOT NULL,
    "rangeStart" TIMESTAMPTZ(3) NOT NULL,
    "rangeEnd" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleVersionItem" (
    "id" UUID NOT NULL,
    "scheduleVersionId" UUID NOT NULL,
    "scheduleBlockId" UUID,
    "snapshot" JSONB NOT NULL,

    CONSTRAINT "ScheduleVersionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrainDump" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "rawText" VARCHAR(10000) NOT NULL,
    "status" "BrainDumpStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" VARCHAR(120) NOT NULL,
    "errorCode" VARCHAR(80),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "BrainDump_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiExtraction" (
    "id" UUID NOT NULL,
    "brainDumpId" UUID NOT NULL,
    "provider" VARCHAR(80) NOT NULL,
    "modelAlias" VARCHAR(80) NOT NULL,
    "schemaVersion" VARCHAR(32) NOT NULL,
    "output" JSONB NOT NULL,
    "latencyMs" INTEGER,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiExtractionItem" (
    "id" UUID NOT NULL,
    "extractionId" UUID NOT NULL,
    "taskId" UUID,
    "position" INTEGER NOT NULL,
    "candidate" JSONB NOT NULL,
    "confidence" JSONB,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AiExtractionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSubscription" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" VARCHAR(500),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationJob" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "scheduleBlockId" UUID NOT NULL,
    "idempotencyKey" VARCHAR(160) NOT NULL,
    "scheduledFor" TIMESTAMPTZ(3) NOT NULL,
    "status" "NotificationJobStatus" NOT NULL DEFAULT 'SCHEDULED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastErrorCode" VARCHAR(80),
    "sentAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "NotificationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(80),
    "entityId" UUID,
    "correlationId" VARCHAR(100),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "Task_userId_status_deadlineAt_idx" ON "Task"("userId", "status", "deadlineAt");

-- CreateIndex
CREATE INDEX "Task_userId_createdAt_idx" ON "Task"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Routine_userId_active_idx" ON "Routine"("userId", "active");

-- CreateIndex
CREATE INDEX "RoutineOccurrence_userId_startsAt_endsAt_idx" ON "RoutineOccurrence"("userId", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineOccurrence_routineId_startsAt_key" ON "RoutineOccurrence"("routineId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleBlock_routineOccurrenceId_key" ON "ScheduleBlock"("routineOccurrenceId");

-- CreateIndex
CREATE INDEX "ScheduleBlock_userId_startsAt_endsAt_idx" ON "ScheduleBlock"("userId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "ScheduleBlock_taskId_idx" ON "ScheduleBlock"("taskId");

-- CreateIndex
CREATE INDEX "ScheduleVersion_userId_createdAt_idx" ON "ScheduleVersion"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ScheduleVersionItem_scheduleVersionId_idx" ON "ScheduleVersionItem"("scheduleVersionId");

-- CreateIndex
CREATE INDEX "BrainDump_userId_createdAt_idx" ON "BrainDump"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BrainDump_userId_idempotencyKey_key" ON "BrainDump"("userId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "AiExtraction_brainDumpId_createdAt_idx" ON "AiExtraction"("brainDumpId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiExtractionItem_extractionId_position_key" ON "AiExtractionItem"("extractionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSubscription_endpoint_key" ON "NotificationSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "NotificationSubscription_userId_active_idx" ON "NotificationSubscription"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationJob_idempotencyKey_key" ON "NotificationJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "NotificationJob_status_scheduledFor_idx" ON "NotificationJob"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "NotificationJob_userId_scheduledFor_idx" ON "NotificationJob"("userId", "scheduledFor");

-- CreateIndex
CREATE INDEX "AuditEvent_userId_createdAt_idx" ON "AuditEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_correlationId_idx" ON "AuditEvent"("correlationId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineOccurrence" ADD CONSTRAINT "RoutineOccurrence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineOccurrence" ADD CONSTRAINT "RoutineOccurrence_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleBlock" ADD CONSTRAINT "ScheduleBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleBlock" ADD CONSTRAINT "ScheduleBlock_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleBlock" ADD CONSTRAINT "ScheduleBlock_routineOccurrenceId_fkey" FOREIGN KEY ("routineOccurrenceId") REFERENCES "RoutineOccurrence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleBlock" ADD CONSTRAINT "ScheduleBlock_scheduleVersionId_fkey" FOREIGN KEY ("scheduleVersionId") REFERENCES "ScheduleVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleVersion" ADD CONSTRAINT "ScheduleVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleVersionItem" ADD CONSTRAINT "ScheduleVersionItem_scheduleVersionId_fkey" FOREIGN KEY ("scheduleVersionId") REFERENCES "ScheduleVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleVersionItem" ADD CONSTRAINT "ScheduleVersionItem_scheduleBlockId_fkey" FOREIGN KEY ("scheduleBlockId") REFERENCES "ScheduleBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrainDump" ADD CONSTRAINT "BrainDump_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiExtraction" ADD CONSTRAINT "AiExtraction_brainDumpId_fkey" FOREIGN KEY ("brainDumpId") REFERENCES "BrainDump"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiExtractionItem" ADD CONSTRAINT "AiExtractionItem_extractionId_fkey" FOREIGN KEY ("extractionId") REFERENCES "AiExtraction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiExtractionItem" ADD CONSTRAINT "AiExtractionItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSubscription" ADD CONSTRAINT "NotificationSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationJob" ADD CONSTRAINT "NotificationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationJob" ADD CONSTRAINT "NotificationJob_scheduleBlockId_fkey" FOREIGN KEY ("scheduleBlockId") REFERENCES "ScheduleBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- PostgreSQL-specific scheduling invariant. Half-open ranges allow one block
-- to start exactly when the previous block ends.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "ScheduleBlock"
ADD CONSTRAINT "schedule_block_no_overlap"
EXCLUDE USING gist (
  "userId" WITH =,
  tstzrange("startsAt", "endsAt", '[)') WITH &&
) WHERE ("status" IN ('PLANNED', 'ACTIVE'));

ALTER TABLE "ScheduleBlock"
ADD CONSTRAINT "schedule_block_positive_duration"
CHECK ("endsAt" > "startsAt");

ALTER TABLE "Task"
ADD CONSTRAINT "task_positive_duration"
CHECK ("estimatedDurationMinutes" > 0);

ALTER TABLE "Task"
ADD CONSTRAINT "task_chunk_configuration"
CHECK (
  ("splittable" = false AND "minimumChunkMinutes" IS NULL)
  OR
  ("splittable" = true AND "minimumChunkMinutes" >= 5)
);
