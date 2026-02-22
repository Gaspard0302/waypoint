import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ScriptTagBlock from "./ScriptTagBlock";
import CrawlButton from "./CrawlButton";
import CrawlHistory from "./CrawlHistory";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SiteDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", id)
    .single();

  if (!site) {
    notFound();
  }

  const { data: crawlJobs } = await supabase
    .from("crawl_jobs")
    .select("*")
    .eq("site_id", id)
    .order("created_at", { ascending: false });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{site.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">{site.url}</p>
      </div>

      {/* API Key */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5 space-y-1">
        <p className="text-sm font-medium text-zinc-700">API Key</p>
        <p className="font-mono text-sm text-zinc-900 break-all">{site.api_key}</p>
        <p className="text-xs text-zinc-400">Keep this secret. Used to authenticate the widget.</p>
      </div>

      {/* Script tag */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <ScriptTagBlock apiKey={site.api_key} backendUrl={backendUrl} />
      </div>

      {/* Indexing */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-900">Indexing</h2>
          <CrawlButton siteId={site.id} backendUrl={backendUrl} />
        </div>
        <CrawlHistory siteId={site.id} initialJobs={crawlJobs ?? []} />
      </div>
    </div>
  );
}
