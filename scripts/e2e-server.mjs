import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

if (existsSync(".env.test")) process.loadEnvFile(".env.test");

const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "-H", "127.0.0.1", "-p", "3100"],
  { env: process.env, stdio: "inherit" },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code) => process.exit(code ?? 0));
