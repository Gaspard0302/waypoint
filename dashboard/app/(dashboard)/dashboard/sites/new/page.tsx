"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewSitePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("sites")
      .insert({ name: name.trim(), url: url.trim() })
      .select("id")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to create site.");
      setLoading(false);
      return;
    }

    router.push(`/dashboard/sites/${data.id}`);
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Add a site</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Site name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My App"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Site URL
          </label>
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating..." : "Create site"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
