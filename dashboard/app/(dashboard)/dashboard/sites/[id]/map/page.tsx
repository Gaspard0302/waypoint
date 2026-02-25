import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SiteMapFlow from "@/components/site-map/SiteMapFlow";
import type { SiteIndexRow } from "@/lib/site-map";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SiteMapPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: site } = await supabase.from("sites").select("*").eq("id", id).single();
  if (!site) notFound();

  const { data: rows } = await supabase
    .from("site_index")
    .select("*")
    .eq("site_id", id)
    .order("created_at", { ascending: true });

  const initialRows = (rows ?? []) as SiteIndexRow[];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/sites/${id}`}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-zinc-900">{site.name}</h1>
            <p className="text-xs text-zinc-400">{site.url}</p>
          </div>
        </div>

        <span className="text-xs text-zinc-400">
          {initialRows.length} page{initialRows.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Map canvas */}
      <div className="flex-1 min-h-0">
        <SiteMapFlow siteId={id} initialRows={initialRows} />
      </div>
    </div>
  );
}
