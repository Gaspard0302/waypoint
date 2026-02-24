import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SitesPage() {
  const supabase = await createClient();
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, url, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Sites</h1>
        <Link
          href="/dashboard/sites/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Add site
        </Link>
      </div>

      {!sites || sites.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center">
          <p className="text-sm text-zinc-500">No sites yet.</p>
          <p className="mt-1 text-xs text-zinc-400">Create a site to get your setup command.</p>
          <Link
            href="/dashboard/sites/new"
            className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            Add your first site
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {sites.map((site) => (
            <Link
              key={site.id}
              href={`/dashboard/sites/${site.id}`}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-5 py-4 hover:border-zinc-400 transition-colors"
            >
              <div>
                <p className="font-medium text-zinc-900">{site.name}</p>
                <p className="mt-0.5 text-sm text-zinc-500">{site.url}</p>
              </div>
              <span className="text-zinc-400">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
