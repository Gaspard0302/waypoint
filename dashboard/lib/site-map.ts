import dagre from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";

export interface SiteIndexRow extends Record<string, unknown> {
  id: string;
  site_id: string;
  route: string;
  title: string | null;
  purpose: string | null;
  elements: Array<{
    label: string;
    selector: string;
    action: string;
  }>;
  created_at: string;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 120;

function findParentId(route: string, rows: SiteIndexRow[]): string | null {
  if (route === "/") return null;

  const parts = route.split("/").filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const candidate = i === 0 ? "/" : "/" + parts.slice(0, i).join("/");
    const parent = rows.find((r) => r.route === candidate);
    if (parent) return parent.id;
  }
  return null;
}

export function buildGraphLayout(rows: SiteIndexRow[]): {
  nodes: Node[];
  edges: Edge[];
} {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 80, marginx: 40, marginy: 40 });

  rows.forEach((row) => {
    g.setNode(row.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  const edgePairs: Array<{ source: string; target: string }> = [];
  rows.forEach((row) => {
    const parentId = findParentId(row.route, rows);
    if (parentId) {
      g.setEdge(parentId, row.id);
      edgePairs.push({ source: parentId, target: row.id });
    }
  });

  dagre.layout(g);

  const nodes: Node[] = rows.map((row) => {
    const nodeWithPosition = g.node(row.id);
    return {
      id: row.id,
      type: "siteMapNode",
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
      data: row,
    };
  });

  const edges: Edge[] = edgePairs.map(({ source, target }) => ({
    id: `${source}-${target}`,
    source,
    target,
    type: "smoothstep",
    style: { stroke: "#d4d4d8", strokeWidth: 1.5 },
  }));

  return { nodes, edges };
}
