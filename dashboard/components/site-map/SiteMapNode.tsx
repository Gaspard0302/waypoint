"use client";

import { Handle, Position } from "@xyflow/react";
import type { SiteIndexRow } from "@/lib/site-map";

interface SiteMapNodeProps {
  data: SiteIndexRow;
}

export default function SiteMapNode({ data }: SiteMapNodeProps) {
  const elementCount = Array.isArray(data.elements) ? data.elements.length : 0;

  return (
    <div className="w-[220px] rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden hover:border-zinc-400 hover:shadow-md transition-all">
      <Handle type="target" position={Position.Top} className="!bg-zinc-300 !border-zinc-400" />

      {/* Route + title */}
      <div className="px-3 pt-3 pb-1 border-b border-zinc-100">
        <p className="text-[11px] font-mono text-zinc-800 truncate leading-tight font-medium">
          {data.route}
        </p>
        {data.title && (
          <p className="text-[11px] text-zinc-500 truncate leading-tight mt-0.5">{data.title}</p>
        )}
      </div>

      {/* Purpose */}
      <div className="px-3 py-2 min-h-[48px]">
        {data.purpose ? (
          <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-3">{data.purpose}</p>
        ) : (
          <p className="text-[10px] text-zinc-300 italic">No description</p>
        )}
      </div>

      {/* Element count */}
      <div className="px-3 pb-2">
        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {elementCount} action{elementCount !== 1 ? "s" : ""}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-zinc-300 !border-zinc-400" />
    </div>
  );
}
