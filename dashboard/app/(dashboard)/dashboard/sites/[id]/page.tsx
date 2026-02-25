import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ScriptTagBlock from "./ScriptTagBlock";
import IndexStatus from "./IndexStatus";
import SetupBlock from "./SetupBlock";

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

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
  const widgetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/widget.js`;

  return (
    <div className="p-8 max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{site.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">{site.url}</p>
      </div>

      {/* Setup */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <SetupBlock apiKey={site.api_key} siteId={site.id} />
      </div>

      {/* API Key */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5 space-y-1">
        <p className="text-sm font-medium text-zinc-700">API Key</p>
        <p className="font-mono text-sm text-zinc-900 break-all">{site.api_key}</p>
        <p className="text-xs text-zinc-400">Keep this secret. Used to authenticate the widget.</p>
      </div>

      {/* Script tag */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <p className="text-sm font-medium text-zinc-700 mb-1">Manual widget install</p>
        <p className="text-xs text-zinc-400 mb-3">Or run <code className="font-mono">/waypoint-install</code> in your coding agent to do this automatically.</p>
        <ScriptTagBlock apiKey={site.api_key} backendUrl={backendUrl} widgetUrl={widgetUrl} />
      </div>

      {/* Index status */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-medium text-zinc-900">Index status</h2>
        <IndexStatus siteId={site.id} />
      </div>
    </div>
  );
}
