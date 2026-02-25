"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import SiteMapNode from "./SiteMapNode";
import { buildGraphLayout, type SiteIndexRow } from "@/lib/site-map";
import { createClient } from "@/lib/supabase/client";

const nodeTypes = { siteMapNode: SiteMapNode };

interface SiteMapFlowInnerProps {
  siteId: string;
  initialRows: SiteIndexRow[];
}

function SiteMapFlowInner({ siteId, initialRows }: SiteMapFlowInnerProps) {
  const [rows, setRows] = useState<SiteIndexRow[]>(initialRows);

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildGraphLayout(rows),
    [rows]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  // Sync layout when rows change
  useEffect(() => {
    const { nodes: n, edges: e } = buildGraphLayout(rows);
    setNodes(n);
    setEdges(e);
  }, [rows, setNodes, setEdges]);

  // Subscribe to Supabase Realtime — refetch on any change to site_index for this site
  useEffect(() => {
    const supabase = createClient();

    const refetch = async () => {
      const { data } = await supabase
        .from("site_index")
        .select("*")
        .eq("site_id", siteId)
        .order("created_at", { ascending: true });
      setRows((data ?? []) as SiteIndexRow[]);
    };

    const channel = supabase
      .channel(`site_index_${siteId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_index",
          filter: `site_id=eq.${siteId}`,
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [siteId]);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-12m12 0v3.75m-12 0v3.75" />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-500">No pages indexed yet</p>
        <p className="text-xs text-zinc-400">
          Run <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded">/waypoint-index</code> in your coding agent to build the map
        </p>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={2}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={true}
    >
      <Background color="#f4f4f5" gap={20} size={1} />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor="#e4e4e7"
        maskColor="rgba(244,244,245,0.8)"
        style={{ border: "1px solid #e4e4e7", borderRadius: 8 }}
      />
    </ReactFlow>
  );
}

interface SiteMapFlowProps {
  siteId: string;
  initialRows: SiteIndexRow[];
}

export default function SiteMapFlow({ siteId, initialRows }: SiteMapFlowProps) {
  return (
    <ReactFlowProvider>
      <SiteMapFlowInner siteId={siteId} initialRows={initialRows} />
    </ReactFlowProvider>
  );
}
