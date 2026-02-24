#!/usr/bin/env node
"use strict";

const readline = require("readline");
const fs = require("fs");
const path = require("path");

// ── Argument parsing ─────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { key: null, site: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--key" && args[i + 1]) result.key = args[++i];
    else if (args[i] === "--site" && args[i + 1]) result.site = args[++i];
    else if (args[i].startsWith("--key=")) result.key = args[i].slice(6);
    else if (args[i].startsWith("--site=")) result.site = args[i].slice(7);
  }
  return result;
}

// ── Prompt helper ────────────────────────────────────────────────────────────

function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

// ── Skill destination by agent ───────────────────────────────────────────────

function skillDest(agent, cwd) {
  switch (agent) {
    case "1": return path.join(cwd, ".claude", "skills");
    case "2": return cwd; // Mistral Vibe — project root
    case "3": return path.join(cwd, ".cursor", "skills");
    default: return path.join(cwd, ".claude", "skills");
  }
}

function skillPrefix(agent) {
  // Mistral Vibe uses uppercase names at project root
  return agent === "2" ? "WAYPOINT-" : "waypoint-";
}

function skillExt(agent) {
  return ".md";
}

// ── .gitignore helper ────────────────────────────────────────────────────────

function ensureGitignore(cwd) {
  const gitignorePath = path.join(cwd, ".gitignore");
  let content = "";
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, "utf8");
  }
  if (!content.split("\n").some((line) => line.trim() === ".waypoint")) {
    const newline = content.endsWith("\n") || content === "" ? "" : "\n";
    fs.writeFileSync(gitignorePath, content + newline + ".waypoint\n", "utf8");
    console.log("  ✓ Added .waypoint to .gitignore");
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\nWaypoint Init\n");

  const args = parseArgs();
  const cwd = process.cwd();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  let apiKey = args.key;
  let siteId = args.site;

  if (!apiKey) {
    apiKey = (await prompt(rl, "API key (from waypoint dashboard): ")).trim();
  }
  if (!siteId) {
    siteId = (await prompt(rl, "Site ID (from waypoint dashboard): ")).trim();
  }

  if (!apiKey || !siteId) {
    console.error("Error: --key and --site are required.");
    rl.close();
    process.exit(1);
  }

  const agentChoice = (
    await prompt(
      rl,
      "Which coding agent?\n  (1) Claude Code\n  (2) Mistral Vibe\n  (3) Cursor\nChoice [1]: "
    )
  ).trim() || "1";

  rl.close();

  // Write .waypoint config
  const configPath = path.join(cwd, ".waypoint");
  fs.writeFileSync(configPath, JSON.stringify({ apiKey, siteId }, null, 2) + "\n", "utf8");
  console.log("  ✓ Written .waypoint config");

  // Update .gitignore
  ensureGitignore(cwd);

  // Copy skill files
  const srcDir = path.join(__dirname, "skills");
  const destDir = skillDest(agentChoice, cwd);
  const prefix = skillPrefix(agentChoice);

  fs.mkdirSync(destDir, { recursive: true });

  const skillNames = ["waypoint-setup", "waypoint-index", "waypoint-install"];
  for (const name of skillNames) {
    const src = path.join(srcDir, name + ".md");
    const baseName = agentChoice === "2"
      ? name.replace("waypoint-", "WAYPOINT-").toUpperCase() + ".md"
      : name + ".md";
    const dest = path.join(destDir, baseName);
    fs.copyFileSync(src, dest);
    console.log(`  ✓ Installed ${path.relative(cwd, dest)}`);
  }

  const agentNames = { "1": "Claude Code", "2": "Mistral Vibe", "3": "Cursor" };
  const agentName = agentNames[agentChoice] ?? "your coding agent";
  const setupCmd = agentChoice === "2" ? "/WAYPOINT-SETUP" : "/waypoint-setup";

  console.log(`
Done! Open ${agentName} in this project and run:

  ${setupCmd}

The wizard will guide you through indexing your codebase and installing the widget.
`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
