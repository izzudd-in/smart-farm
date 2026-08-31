import "dotenv/config";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { env } from "../src/lib/env";

async function backupDatabase() {
  console.log("=== Smart Farm Database Backup Runner ===");

  const backupDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace("T", "_")
    .split(".")[0];

  const backupPath = path.join(backupDir, `smartfarm_backup_${timestamp}.sql`);

  console.log(`Target backup file: ${backupPath}`);
  console.log("Running pg_dump from configured DATABASE_URL...");

  try {
    execSync(`pg_dump "${env.DATABASE_URL}" --file="${backupPath}"`, {
      stdio: "inherit",
    });

    const stats = fs.statSync(backupPath);
    console.log(`[+] Backup created successfully! Size: ${(stats.size / 1024).toFixed(2)} KB`);
  } catch (error: unknown) {
    console.error("[-] Backup failed. Note: Ensure pg_dump utility is installed in system PATH.");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

backupDatabase();
