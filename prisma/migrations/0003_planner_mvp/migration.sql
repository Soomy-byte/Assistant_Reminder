-- Planner MVP: monthly goals and durable schedule proposals.

CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "ProposalKind" AS ENUM ('NEW_SCHEDULE', 'RESCHEDULE');

CREATE TABLE "Goal" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(3000),
    "monthStart" DATE NOT NULL,
    "targetAt" TIMESTAMPTZ(3),
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Task" ADD COLUMN "goalId" UUID;
ALTER TABLE "ScheduleVersion" ADD COLUMN "undoneAt" TIMESTAMPTZ(3);

CREATE TABLE "ScheduleProposal" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "ProposalKind" NOT NULL DEFAULT 'NEW_SCHEDULE',
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "rangeStart" TIMESTAMPTZ(3) NOT NULL,
    "rangeEnd" TIMESTAMPTZ(3) NOT NULL,
    "unscheduled" JSONB NOT NULL,
    "snapshot" JSONB,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMPTZ(3),
    CONSTRAINT "ScheduleProposal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScheduleProposalItem" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "scheduleBlockId" UUID,
    "title" VARCHAR(200) NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    CONSTRAINT "ScheduleProposalItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Goal_userId_monthStart_status_idx" ON "Goal"("userId", "monthStart", "status");
CREATE INDEX "Task_goalId_idx" ON "Task"("goalId");
CREATE INDEX "ScheduleProposal_userId_status_createdAt_idx" ON "ScheduleProposal"("userId", "status", "createdAt");
CREATE INDEX "ScheduleProposalItem_proposalId_idx" ON "ScheduleProposalItem"("proposalId");
CREATE INDEX "ScheduleProposalItem_taskId_idx" ON "ScheduleProposalItem"("taskId");

ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScheduleProposal" ADD CONSTRAINT "ScheduleProposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleProposalItem" ADD CONSTRAINT "ScheduleProposalItem_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "ScheduleProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleProposalItem" ADD CONSTRAINT "ScheduleProposalItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScheduleProposalItem" ADD CONSTRAINT "ScheduleProposalItem_scheduleBlockId_fkey" FOREIGN KEY ("scheduleBlockId") REFERENCES "ScheduleBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Goal" ADD CONSTRAINT "goal_progress_range" CHECK ("progress" BETWEEN 0 AND 100);
ALTER TABLE "ScheduleProposal" ADD CONSTRAINT "schedule_proposal_positive_range" CHECK ("rangeEnd" > "rangeStart");
ALTER TABLE "ScheduleProposalItem" ADD CONSTRAINT "proposal_item_positive_duration" CHECK ("endsAt" > "startsAt" AND "durationMinutes" > 0);
