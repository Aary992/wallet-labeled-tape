// One command for a fresh clone on any machine:  npm run setup
//
//   1. Checks Node is 22.13+ (the backend uses the built-in node:sqlite).
//   2. Installs packages with npm ci.
//   3. Adds "wallet-tape" previews to .claude/launch.json in the folder Claude Code is launched
//      from, because Claude's preview tools read that file there, not from this repo.
//      Default folder: ~/Documents. Change it with --claude-root <dir>, skip it with --no-claude.
//   4. Checks the Hyperliquid API with `npm run probe` (skip it with --no-probe).

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const has = (name) => args.includes(name);
const valueOf = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const step = (msg) => console.log(`\n> ${msg}`);
const fail = (msg) => {
  console.error(`\n${msg}`);
  process.exit(1);
};
const run = (cmd, cmdArgs) => {
  const r = spawnSync(cmd, cmdArgs, { cwd: repo, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) fail(`"${cmd} ${cmdArgs.join(" ")}" failed (exit ${r.status}).`);
};

// 1. Node
step("Checking Node");
const [major = 0, minor = 0] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  fail(
    `Node ${process.versions.node} is too old: the backend needs 22.13 or newer for node:sqlite.\n` +
      "With nvm-windows: nvm install 22.21.0, then nvm use 22.21.0, then run this again.",
  );
}
console.log(`Node ${process.versions.node} is fine.`);

// 2. Packages
step("Installing packages (npm ci)");
run("npm", ["ci", "--no-audit", "--no-fund"]);

// 3. Claude preview entries
if (!has("--no-claude")) {
  const root = resolve(valueOf("--claude-root", join(homedir(), "Documents")));
  const file = join(root, ".claude", "launch.json");
  step(`Adding the wallet-tape previews to ${file}`);

  let launch = { version: "0.0.1", configurations: [] };
  let readable = true;
  let backedUp = false;
  if (existsSync(file)) {
    try {
      launch = JSON.parse(readFileSync(file, "utf8").replace(/^﻿/, ""));
      copyFileSync(file, `${file}.bak`);
      backedUp = true;
    } catch {
      readable = false;
      console.warn(`Could not read ${file} as JSON, so it was left alone. Add the entries by hand (see CONTEXT.md).`);
    }
  } else {
    mkdirSync(dirname(file), { recursive: true });
  }

  if (readable) {
    if (!Array.isArray(launch.configurations)) launch.configurations = [];
    const entries = [
      { name: "wallet-tape", runtimeExecutable: "npm", runtimeArgs: ["--prefix", repo, "run", "dev"], port: 5181 },
      { name: "wallet-tape-fake", runtimeExecutable: "npm", runtimeArgs: ["--prefix", repo, "run", "dev:fake"], port: 5181 },
    ];
    for (const entry of entries) {
      const i = launch.configurations.findIndex((c) => c && c.name === entry.name);
      if (i >= 0) launch.configurations[i] = entry;
      else launch.configurations.push(entry);
    }
    writeFileSync(file, `${JSON.stringify(launch, null, 2)}\n`);
    console.log(
      `Done${backedUp ? " (the previous file is kept as launch.json.bak)" : ""}. In Claude, start the preview named wallet-tape.`,
    );
  }
}

// 4. API check
if (!has("--no-probe")) {
  step("Checking the Hyperliquid API (npm run probe)");
  run("npm", ["run", "probe"]);
}

console.log("\nAll set. Start it with: npm run dev   then open http://localhost:5181");
