import { copyFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (!existsSync(".env.test")) {
  copyFileSync(".env.test.example", ".env.test");
  console.log("[e2e] .env.test dibuat dari .env.test.example");
}

function run(command, args) {
  const result = spawnSync(command, args, { shell: process.platform === "win32", stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("docker", ["compose", "-f", "docker-compose.test.yml", "up", "-d", "--wait"]);
run(process.execPath, ["--env-file=.env.test", "node_modules/prisma/build/index.js", "migrate", "deploy"]);
console.log("[e2e] PostgreSQL, Redis, dan schema tes siap.");
