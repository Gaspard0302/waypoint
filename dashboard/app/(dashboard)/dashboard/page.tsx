import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, url, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const hasSites = (sites?.length ?? 0) > 0;

  return (
    <div className="p-8 max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {hasSites ? "Here are your sites." : "Get started by adding your first site."}
        </p>
      </div>

      {hasSites ? (
        <>
          {/* Sites list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-700">Your sites</h2>
              <Link
                href="/dashboard/sites"
                className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-2">
              {sites!.map((site) => (
                <Link
                  key={site.id}
                  href={`/dashboard/sites/${site.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-400 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{site.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{site.url}</p>
                  </div>
                  <span className="text-zinc-300 group-hover:text-zinc-600 transition-colors">→</span>
                </Link>
              ))}
            </div>
            <Link
              href="/dashboard/sites/new"
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <span className="text-base leading-none">+</span> Add another site
            </Link>
          </div>

          {/* How it works */}
          <div className="rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-medium text-zinc-900">How to re-index</h2>
            <ol className="space-y-2 text-sm text-zinc-600">
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center text-xs font-medium">1</span>
                Open your project in your coding agent (Claude Code, Cursor, etc.)
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center text-xs font-medium">2</span>
                Run <code className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded">/waypoint-index</code> to send an updated map
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center text-xs font-medium">3</span>
                The site map and widget agent update instantly
              </li>
            </ol>
          </div>
        </>
      ) : (
        <>
          {/* Empty state */}
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-700">No sites yet</p>
              <p className="text-xs text-zinc-400 mt-1">Add a site to get your setup command.</p>
            </div>
            <Link
              href="/dashboard/sites/new"
              className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              Add your first site
            </Link>
          </div>

          {/* How it works */}
          <div className="rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-medium text-zinc-900">How it works</h2>
            <ol className="space-y-3 text-sm text-zinc-600">
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center text-xs font-medium">1</span>
                Create a site — you'll get an API key and a one-line setup command
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center text-xs font-medium">2</span>
                Run <code className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded">npx waypoint-init</code> in your project terminal
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center text-xs font-medium">3</span>
                Run <code className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded">/waypoint-setup</code> in your coding agent — it guides you from there
              </li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
