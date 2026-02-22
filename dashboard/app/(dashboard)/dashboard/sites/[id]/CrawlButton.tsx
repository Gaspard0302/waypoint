"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  siteId: string;
  backendUrl: string;
}

export default function CrawlButton({ siteId, backendUrl }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setError("Not authenticated.");
      setLoading(false);
      return;
    }

    const res = await fetch(`${backendUrl}/sites/${siteId}/crawl`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      setError(`Error: ${res.status} — ${body}`);
      setLoading(false);
      return;
    }

    setLoading(false);
    // Trigger a page refresh so CrawlHistory picks up the new job
    window.location.reload();
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Triggering..." : "Re-index now"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
