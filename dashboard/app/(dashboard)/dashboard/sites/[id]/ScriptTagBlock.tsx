"use client";

import { useState } from "react";

interface Props {
  apiKey: string;
  backendUrl: string;
}

export default function ScriptTagBlock({ apiKey, backendUrl }: Props) {
  const [copied, setCopied] = useState(false);

  const scriptTag = `<script\n  src="https://cdn.waypoint.ai/waypoint.min.js"\n  data-key="${apiKey}"\n  data-backend="${backendUrl}"\n></script>`;

  async function handleCopy() {
    await navigator.clipboard.writeText(scriptTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-zinc-700">Script tag</h2>
        <button
          onClick={handleCopy}
          className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-zinc-950 p-4 text-xs text-zinc-100">
        {scriptTag}
      </pre>
      <p className="mt-2 text-xs text-zinc-500">
        Paste this before the closing <code>&lt;/body&gt;</code> tag on every page of your site.
      </p>
    </div>
  );
}
