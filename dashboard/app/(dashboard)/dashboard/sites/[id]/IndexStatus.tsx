import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface Props { siteId: string }

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default async function IndexStatus({ siteId }: Props) {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from("site_index")
    .select("created_at", { count: "exact" })
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(1);

  const n = count ?? 0;
  if (n === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Not indexed yet. Run{" "}
        <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded">/waypoint-index</code>{" "}
        in your coding agent.
      </p>
    );
  }
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-zinc-700">
        <span className="font-medium">{n}</span> {n === 1 ? "route" : "routes"} indexed
        {data?.[0] && <span className="text-zinc-400"> · {timeAgo(data[0].created_at)}</span>}
      </p>
      <Link href={`/dashboard/sites/${siteId}/map`} className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
        View map →
      </Link>
    </div>
  );
}
