"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface CrawlJob {
  id: string;
  status: string;
  triggered_by: string;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
  created_at: string;
}

interface Props {
  siteId: string;
  initialJobs: CrawlJob[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  running: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

export default function CrawlHistory({ siteId, initialJobs }: Props) {
  const [jobs, setJobs] = useState<CrawlJob[]>(initialJobs);

  useEffect(() => {
    const supabase = createClient();

    function shouldPoll(jobs: CrawlJob[]): boolean {
      return jobs.some((j) => j.status === "pending" || j.status === "running");
    }

    async function fetchJobs() {
      const { data } = await supabase
        .from("crawl_jobs")
        .select("*")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false });
      if (data) setJobs(data as CrawlJob[]);
    }

    let interval: ReturnType<typeof setInterval> | null = null;

    function startPolling() {
      interval = setInterval(async () => {
        await fetchJobs();
        setJobs((current) => {
          if (!shouldPoll(current) && interval) {
            clearInterval(interval!);
            interval = null;
          }
          return current;
        });
      }, 2000);
    }

    if (shouldPoll(jobs)) {
      startPolling();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  if (jobs.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No index runs yet. Run /waypoint-index in your coding agent to start.</p>
    );
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="flex flex-col gap-1 rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm"
        >
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[job.status] ?? "bg-zinc-100 text-zinc-700"}`}
            >
              {job.status}
            </span>
            <span className="text-zinc-500">{job.triggered_by}</span>
            <span className="ml-auto text-zinc-400 text-xs">{formatDate(job.created_at)}</span>
          </div>
          {job.error && (
            <p className="text-xs text-red-600 mt-1">{job.error}</p>
          )}
          {job.finished_at && (
            <p className="text-xs text-zinc-400">
              Finished: {formatDate(job.finished_at)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
