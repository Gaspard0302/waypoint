"use client";

import { useState } from "react";

interface Props {
  apiKey: string;
  siteId: string;
}

export default function SetupBlock({ apiKey, siteId }: Props) {
  const [copied, setCopied] = useState(false);
  const cmd = `npx waypoint-init --key ${apiKey} --site ${siteId}`;

  async function copy() {
    await navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-zinc-900">Setup</h2>

      <div className="space-y-1">
        <p className="text-xs text-zinc-500">1. Run this in your project terminal:</p>
        <div className="flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-3">
          <code className="flex-1 font-mono text-xs text-zinc-300 break-all">{cmd}</code>
          <button
            onClick={copy}
            className="shrink-0 rounded px-2 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-zinc-500">2. Then in your coding agent, run:</p>
        <code className="block font-mono text-xs text-zinc-700 bg-zinc-100 rounded px-3 py-2">/waypoint-setup</code>
      </div>

      <p className="text-xs text-zinc-400">Works with Claude Code, Mistral Vibe, and Cursor.</p>
    </div>
  );
}
