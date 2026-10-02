import { mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
mkdirSync("release", { recursive: true });
rmSync("release/perk-done-0.3.0.zip", { force: true });
const result = spawnSync(
  "/usr/bin/zip",
  ["-qr", "../release/perk-done-0.3.0.zip", "."],
  { cwd: "dist", stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status ?? 1);
console.log("Created release/perk-done-0.3.0.zip");
