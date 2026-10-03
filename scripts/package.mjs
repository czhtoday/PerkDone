import { copyFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

const manifest = JSON.parse(readFileSync("dist/manifest.json", "utf8"));
const project = JSON.parse(readFileSync("package.json", "utf8"));
if (manifest.version !== project.version) {
  throw new Error(
    "Keep public/manifest.json and package.json versions in sync.",
  );
}
const archive = `perk-done-${manifest.version}.zip`;
mkdirSync("release", { recursive: true });
copyFileSync("LICENSE", "dist/LICENSE");
copyFileSync("THIRD_PARTY_NOTICES.md", "dist/THIRD_PARTY_NOTICES.md");
mkdirSync("dist/licenses", { recursive: true });
for (const dependency of ["react", "react-dom", "lucide-react"]) {
  copyFileSync(
    `node_modules/${dependency}/LICENSE`,
    `dist/licenses/${dependency}-LICENSE`,
  );
}
rmSync(`release/${archive}`, { force: true });
const result = spawnSync(
  "/usr/bin/zip",
  ["-qr", `../release/${archive}`, "."],
  {
    cwd: "dist",
    stdio: "inherit",
  },
);
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`Created release/${archive}`);
