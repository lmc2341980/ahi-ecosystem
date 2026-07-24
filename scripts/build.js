#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const root = path.resolve(__dirname, "..");

const packages = [
  "packages/shared",
  "packages/sdk",
  "packages/ui",
];

const apps = ["apps/portal"];

function runTask(dir, task) {
  const pkgPath = path.join(root, dir, "package.json");
  if (!fs.existsSync(pkgPath)) return;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (!pkg.scripts || !pkg.scripts[task]) return;
  const cwd = path.join(root, dir);
  console.log(`\n${pkg.name}:${task}: running ${task} in ${dir}`);
  execSync(`npm run ${task}`, { cwd, stdio: "inherit" });
}

const task = process.argv[2] || "build";

if (task === "build") {
  for (const pkg of packages) runTask(pkg, "build");
  for (const app of apps) runTask(app, "build");
} else if (task === "type-check") {
  for (const pkg of packages) runTask(pkg, "type-check");
  for (const app of apps) runTask(app, "type-check");
} else if (task === "lint") {
  for (const pkg of packages) runTask(pkg, "lint");
  for (const app of apps) runTask(app, "lint");
} else if (task === "clean") {
  for (const pkg of packages) runTask(pkg, "clean");
  for (const app of apps) runTask(app, "clean");
} else {
  for (const pkg of packages) runTask(pkg, task);
  for (const app of apps) runTask(app, task);
}
