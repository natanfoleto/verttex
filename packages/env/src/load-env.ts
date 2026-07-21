import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

export function loadRootEnv() {
  let currentDir = process.cwd();

  for (let i = 0; i < 5; i++) {
    const envPath = path.join(currentDir, ".env");
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      return;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
}

loadRootEnv();
