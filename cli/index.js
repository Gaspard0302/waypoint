#!/usr/bin/env node
"use strict";

const readline = require("readline");
const fs = require("fs");
const path = require("path");

// ── Argument parsing ──────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { key: null, site: null, backend: null, app: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--key" && args[i + 1]) result.key = args[++i];
    else if (args[i] === "--site" && args[i + 1]) result.site = args[++i];
    else if (args[i] === "--backend" && args[i + 1]) result.backend = args[++i];
    else if (args[i] === "--app" && args[i + 1]) result.app = args[++i];
    else if (args[i].startsWith("--key=")) result.key = args[i].slice(6);
    else if (args[i].startsWith("--site=")) result.site = args[i].slice(7);
    else if (args[i].startsWith("--backend=")) result.backend = args[i].slice(10);
    else if (args[i].startsWith("--app=")) result.app = args[i].slice(6);
  }
  return result;
}

// ── Prompt helper ─────────────────────────────────────────────────────────────

function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

// ── Agent definitions ─────────────────────────────────────────────────────────
//
// single: true  — all 3 skills are written into one file (agents without per-file skill systems)
// single: false — 3 separate files are written into dest directory
// adaptContent  — replace /slash-command references with natural language equivalents
// appendMode    — append to existing file rather than overwrite (e.g. copilot-instructions.md)
// detect        — returns true when this agent's config dir is present in cwd

const AGENTS = [
  {
    key: "1",
    name: "Claude Code",
    detect: (cwd) => fs.existsSync(path.join(cwd, ".claude")),
    dest: (cwd) => path.join(cwd, ".claude", "skills"),
    fileNames: {
      setup: "waypoint-setup.md",
      index: "waypoint-index.md",
      install: "waypoint-install.md",
    },
    single: false,
    invokeCmd: "/waypoint-setup",
    adaptContent: false, // slash commands are natively supported
  },
  {
    key: "2",
    name: "Cursor",
    detect: (cwd) => fs.existsSync(path.join(cwd, ".cursor")),
    dest: (cwd) => path.join(cwd, ".cursor", "rules"),
    fileNames: {
      setup: "waypoint-setup.mdc",
      index: "waypoint-index.mdc",
      install: "waypoint-install.mdc",
    },
    single: false,
    invokeCmd: 'tell the agent: "run waypoint setup"',
    adaptContent: true,
  },
  {
    key: "3",
    name: "Windsurf",
    detect: (cwd) => fs.existsSync(path.join(cwd, ".windsurf")),
    dest: (cwd) => path.join(cwd, ".windsurf", "rules"),
    fileNames: {
      setup: "waypoint-setup.md",
      index: "waypoint-index.md",
      install: "waypoint-install.md",
    },
    single: false,
    invokeCmd: 'tell the agent: "run waypoint setup"',
    adaptContent: true,
  },
  {
    key: "4",
    name: "OpenAI Codex",
    detect: (cwd) => fs.existsSync(path.join(cwd, "AGENTS.md")),
    dest: (cwd) => cwd,
    single: true,
    singleFile: "AGENTS.md",
    invokeCmd: 'tell the agent: "run waypoint setup"',
    adaptContent: true,
    appendMode: false,
  },
  {
    key: "5",
    name: "Gemini CLI",
    detect: (cwd) => fs.existsSync(path.join(cwd, "GEMINI.md")),
    dest: (cwd) => cwd,
    single: true,
    singleFile: "GEMINI.md",
    invokeCmd: 'tell the agent: "run waypoint setup"',
    adaptContent: true,
    appendMode: false,
  },
  {
    key: "6",
    name: "GitHub Copilot",
    detect: (cwd) =>
      fs.existsSync(path.join(cwd, ".github", "copilot-instructions.md")),
    dest: (cwd) => path.join(cwd, ".github"),
    single: true,
    singleFile: "copilot-instructions.md",
    invokeCmd: 'tell Copilot: "run waypoint setup"',
    adaptContent: true,
    appendMode: true, // may already have other instructions — append, don't replace
  },
  {
    key: "7",
    name: "Mistral Le Chat (Vibe)",
    detect: (cwd) => false,
    dest: (cwd) => cwd,
    fileNames: {
      setup: "WAYPOINT-SETUP.md",
      index: "WAYPOINT-INDEX.md",
      install: "WAYPOINT-INSTALL.md",
    },
    single: false,
    invokeCmd: "/WAYPOINT-SETUP",
    adaptContent: false,
  },
  {
    key: "8",
    name: "Other / Generic",
    detect: (cwd) => false,
    dest: (cwd) => path.join(cwd, ".waypoint-skills"),
    fileNames: {
      setup: "waypoint-setup.md",
      index: "waypoint-index.md",
      install: "waypoint-install.md",
    },
    single: false,
    invokeCmd:
      'open .waypoint-skills/waypoint-setup.md and paste it into your agent',
    adaptContent: true,
  },
];

// ── Content adaptation ────────────────────────────────────────────────────────
// Replaces Claude Code slash-command invocations with plain-language equivalents
// for agents that don't support the /skill-name syntax.

function adaptSkillContent(content) {
  return content
    .replace(
      /→ Type \/waypoint-index to continue\./g,
      '→ Tell your agent: "run waypoint index"'
    )
    .replace(
      /→ Type \/waypoint-install to embed the widget\./g,
      '→ Tell your agent: "run waypoint install"'
    )
    .replace(
      /return here and run `\/waypoint-setup` again\./g,
      "restart the Waypoint setup with your agent."
    )
    .replace(
      /Do not run `\/waypoint-index` automatically\. The user must trigger it\./g,
      "Do not proceed to indexing automatically. Wait for the user to say so."
    )
    .replace(
      /Do not run `\/waypoint-install` automatically\. The user must trigger it\./g,
      "Do not proceed to install automatically. Wait for the user to say so."
    );
}

function readSkill(srcDir, name, agent) {
  const content = fs.readFileSync(path.join(srcDir, name + ".md"), "utf8");
  return agent.adaptContent ? adaptSkillContent(content) : content;
}

// ── Single-file builder ───────────────────────────────────────────────────────
// Concatenates all 3 skills into one file for agents without per-file systems.

function buildSingleFile(srcDir, agent) {
  const phases = [
    { name: "waypoint-setup", label: "Phase 1 — Setup" },
    { name: "waypoint-index", label: "Phase 2 — Index" },
    { name: "waypoint-install", label: "Phase 3 — Install" },
  ];

  const header = [
    "# Waypoint — Agent Instructions",
    "",
    "Follow these three phases in order to set up Waypoint for this project.",
    'When asked to "run waypoint setup", "run waypoint index", or "run waypoint install",',
    "follow the corresponding phase below.",
    "",
    "---",
    "",
  ].join("\n");

  const body = phases
    .map(({ name, label }) => {
      const content = readSkill(srcDir, name, agent);
      return `## ${label}\n\n${content}`;
    })
    .join("\n\n---\n\n");

  return header + body;
}

// ── .gitignore helper ─────────────────────────────────────────────────────────

function ensureGitignore(cwd) {
  const gitignorePath = path.join(cwd, ".gitignore");
  let content = "";
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, "utf8");
  }
  if (!content.split("\n").some((line) => line.trim() === ".waypoint")) {
    const newline = content.endsWith("\n") || content === "" ? "" : "\n";
    fs.writeFileSync(
      gitignorePath,
      content + newline + ".waypoint\n",
      "utf8"
    );
    console.log("  ✓ Added .waypoint to .gitignore");
  }
}

// ── Auto-detect agent ─────────────────────────────────────────────────────────

function detectAgentKey(cwd) {
  for (const agent of AGENTS) {
    if (agent.detect(cwd)) return agent.key;
  }
  return null;
}

// ── Install skill files ───────────────────────────────────────────────────────

function installSkills(srcDir, cwd, agent) {
  const destDir = agent.dest(cwd);
  fs.mkdirSync(destDir, { recursive: true });

  if (agent.single) {
    const newContent = buildSingleFile(srcDir, agent);
    const destFile = path.join(destDir, agent.singleFile);

    if (agent.appendMode && fs.existsSync(destFile)) {
      const existing = fs.readFileSync(destFile, "utf8");
      if (existing.includes("<!-- waypoint-skills -->")) {
        // Replace existing waypoint block
        const before = existing.split("<!-- waypoint-skills -->")[0].trimEnd();
        fs.writeFileSync(
          destFile,
          before + "\n\n<!-- waypoint-skills -->\n" + newContent,
          "utf8"
        );
      } else {
        // Append new block
        const sep = existing.endsWith("\n") ? "" : "\n";
        fs.writeFileSync(
          destFile,
          existing + sep + "\n<!-- waypoint-skills -->\n" + newContent,
          "utf8"
        );
      }
    } else {
      fs.writeFileSync(destFile, newContent, "utf8");
    }
    console.log(`  ✓ Installed ${path.relative(cwd, destFile)}`);
  } else {
    const skills = [
      { key: "setup", src: "waypoint-setup" },
      { key: "index", src: "waypoint-index" },
      { key: "install", src: "waypoint-install" },
    ];
    for (const { key, src } of skills) {
      const content = readSkill(srcDir, src, agent);
      const destFile = path.join(destDir, agent.fileNames[key]);
      fs.writeFileSync(destFile, content, "utf8");
      console.log(`  ✓ Installed ${path.relative(cwd, destFile)}`);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\nWaypoint Init\n");

  const args = parseArgs();
  const cwd = process.cwd();
  const srcDir = path.join(__dirname, "skills");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let apiKey = args.key;
  let siteId = args.site;
  let backendUrl = args.backend;
  let appUrl = args.app;

  if (!apiKey) {
    apiKey = (await prompt(rl, "API key (from Waypoint dashboard): ")).trim();
  }
  if (!siteId) {
    siteId = (await prompt(rl, "Site ID (from Waypoint dashboard): ")).trim();
  }

  if (!apiKey || !siteId) {
    console.error("Error: API key and site ID are required.");
    rl.close();
    process.exit(1);
  }

  if (!backendUrl) {
    const raw = (
      await prompt(rl, "Backend URL [https://api.waypoint.ai]: ")
    ).trim();
    backendUrl = raw || "https://api.waypoint.ai";
  }

  if (!appUrl) {
    const raw = (
      await prompt(rl, "App URL [https://waypoint.ai]: ")
    ).trim();
    appUrl = raw || "https://waypoint.ai";
  }

  // Agent selection — auto-detect and pre-select if possible
  const detectedKey = detectAgentKey(cwd);
  const menuLines = AGENTS.map((a) => {
    const tag = a.key === detectedKey ? " (detected)" : "";
    return `  (${a.key}) ${a.name}${tag}`;
  }).join("\n");
  const defaultKey = detectedKey || "1";

  const agentChoice = (
    await prompt(rl, `\nWhich coding agent?\n${menuLines}\nChoice [${defaultKey}]: `)
  ).trim() || defaultKey;

  rl.close();

  const agent =
    AGENTS.find((a) => a.key === agentChoice) ||
    AGENTS.find((a) => a.key === "8"); // fallback to Generic

  // Write .waypoint config
  const configPath = path.join(cwd, ".waypoint");
  fs.writeFileSync(
    configPath,
    JSON.stringify({ apiKey, siteId, backendUrl, appUrl }, null, 2) + "\n",
    "utf8"
  );
  console.log("\n  ✓ Written .waypoint config");

  ensureGitignore(cwd);
  installSkills(srcDir, cwd, agent);

  const invokeInstruction =
    agent.invokeCmd.startsWith("/") || agent.invokeCmd.startsWith("tell") || agent.invokeCmd.startsWith("open")
      ? agent.invokeCmd
      : `run ${agent.invokeCmd}`;

  console.log(`
Done! Open ${agent.name} in this project and ${invokeInstruction}.

The wizard will guide you through indexing your codebase and installing the widget.
`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
