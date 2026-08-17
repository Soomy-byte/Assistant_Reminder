import { Queue, Worker, type ConnectionOptions, type Job } from "bullmq";
import webpush from "web-push";
import { prisma } from "@/lib/db/prisma";

const queueName = "assistant-reminder-notifications";

function redisConnection(): ConnectionOptions {
  const url = new URL(process.env.REDIS_URL || "redis://localhost:6379");
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    ...(url.protocol === "rediss:" ? { tls: {} } : {}),
  };
}

const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
const subject = process.env.WEB_PUSH_SUBJECT;
if (!publicKey || !privateKey || !subject) throw new Error("WEB_PUSH_PUBLIC_KEY, WEB_PUSH_PRIVATE_KEY, dan WEB_PUSH_SUBJECT wajib diisi.");
webpush.setVapidDetails(subject, publicKey, privateKey);

const connection = redisConnection();
const queue = new Queue(queueName, { connection });

async function enqueueUpcomingJobs() {
  const now = new Date();
  const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const jobs = await prisma.notificationJob.findMany({
    where: {
      status: "SCHEDULED",
      scheduledFor: { lte: horizon },
      scheduleBlock: { status: { in: ["PLANNED", "ACTIVE"] } },
      user: { notificationSubscriptions: { some: { active: true } } },
    },
    select: { id: true, scheduledFor: true },
    take: 1000,
  });
  await Promise.all(jobs.map((job) => queue.add("deliver", { notificationJobId: job.id }, {
    jobId: job.id,
    delay: Math.max(0, job.scheduledFor.getTime() - Date.now()),
    attempts: 5,
    backoff: { type: "exponential", delay: 30000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 7 * 86400 },
  })));
}

type DeliveryData = { notificationJobId: string };

async function deliver(job: Job<DeliveryData>) {
  const notification = await prisma.notificationJob.findUnique({
    where: { id: job.data.notificationJobId },
    include: {
      scheduleBlock: { select: { title: true, startsAt: true, status: true } },
      user: { include: { preference: true, notificationSubscriptions: { where: { active: true } } } },
    },
  });
  if (!notification || notification.status !== "SCHEDULED" || !["PLANNED", "ACTIVE"].includes(notification.scheduleBlock.status)) return;

  const claimed = await prisma.notificationJob.updateMany({
    where: { id: notification.id, status: "SCHEDULED" },
    data: { status: "PROCESSING", attempts: { increment: 1 }, lastErrorCode: null },
  });
  if (!claimed.count) return;

  const timezone = notification.user.preference?.timezone ?? "Asia/Jakarta";
  const start = new Intl.DateTimeFormat("id-ID", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(notification.scheduleBlock.startsAt);
  const payload = JSON.stringify({
    title: notification.scheduleBlock.title,
    body: `Dimulai pukul ${start}. Ketuk untuk melihat agenda.`,
    tag: `schedule-block:${notification.scheduleBlockId}`,
    url: "/",
  });

  let delivered = 0;
  let temporaryFailure = false;
  for (const subscription of notification.user.notificationSubscriptions) {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload, { TTL: 3600, urgency: "normal" });
      delivered += 1;
    } catch (error) {
      const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
      if (statusCode === 404 || statusCode === 410) await prisma.notificationSubscription.update({ where: { id: subscription.id }, data: { active: false, lastSeenAt: new Date() } });
      else temporaryFailure = true;
    }
  }

  if (delivered > 0) {
    await prisma.notificationJob.update({ where: { id: notification.id }, data: { status: "SENT", sentAt: new Date(), lastErrorCode: temporaryFailure ? "PARTIAL_DELIVERY" : null } });
    return;
  }
  await prisma.notificationJob.update({ where: { id: notification.id }, data: { status: "SCHEDULED", lastErrorCode: temporaryFailure ? "PUSH_TEMPORARY_FAILURE" : "NO_ACTIVE_SUBSCRIPTION" } });
  if (temporaryFailure) throw new Error("PUSH_TEMPORARY_FAILURE");
}

const worker = new Worker<DeliveryData>(queueName, deliver, { connection, concurrency: 5 });
worker.on("completed", (job) => console.log(`[notification] selesai ${job.id}`));
worker.on("failed", (job, error) => {
  console.error(`[notification] gagal ${job?.id}: ${error.message}`);
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) void prisma.notificationJob.updateMany({ where: { id: job.data.notificationJobId, status: "SCHEDULED" }, data: { status: "FAILED", lastErrorCode: "PUSH_RETRY_EXHAUSTED" } });
});

await enqueueUpcomingJobs();
const syncTimer = setInterval(() => void enqueueUpcomingJobs().catch((error) => console.error("[notification] sinkronisasi gagal", error)), 30000);
console.log("Worker notifikasi Assistant Reminder aktif.");

async function shutdown() {
  clearInterval(syncTimer);
  await worker.close();
  await queue.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
