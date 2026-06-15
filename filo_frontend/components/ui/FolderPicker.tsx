"use client";

import { useState, useEffect, useCallback } from "react";
import type { Folder } from "@/types";
import { get } from "@/lib/api.client";
import { ChevronDownIcon, ChevronRightIcon, FolderIcon, HomeIcon } from "lucide-react";

interface TreeNode {
  folder: Folder;
  children: TreeNode[];
  loaded: boolean;
  open: boolean;
  loading: boolean;
}

interface Props {
  excludeId?: string; // folder/file being moved — excluded from picking
  value: string | null; // currently selected folder id (null = root)
  onChange: (id: string | null) => void;
}

function FolderRow({
  node,
  depth,
  excludeId,
  selected,
  onSelect,
  onToggle,
  onLoadChildren,
}: {
  node: TreeNode;
  depth: number;
  excludeId?: string;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onToggle: (id: string) => void;
  onLoadChildren: (id: string) => void;
}) {
  const isExcluded = node.folder.id === excludeId;
  const isSelected = selected === node.folder.id;
  const hasChildren = node.folder._count.children > 0;

  const handleToggle = () => {
    if (hasChildren) {
      if (!node.loaded) onLoadChildren(node.folder.id);
      onToggle(node.folder.id);
    }
  };

  if (isExcluded) return null;

  return (
    <>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all"
        style={{
          paddingLeft: `${12 + depth * 20}px`,
          background: isSelected ? "var(--color-accent-dim)" : "transparent",
          color: isSelected ? "var(--color-accent)" : "var(--color-text)",
          border: isSelected ? "1px solid rgba(56,189,248,0.2)" : "1px solid transparent",
        }}
        onClick={() => onSelect(node.folder.id)}
      >
        {/* Expand toggle */}
        <span
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          className="text-text-muted shrink-0 w-4 flex items-center justify-center text-xs"
        >
          {node.loading ? (
            <div className="animate-spin size-3 rounded-full border-[1.5px] border-text-muted border-t-transparent" />
          ) : hasChildren ? (
            node.open ? (
              <ChevronDownIcon className="size-4" />
            ) : (
              <ChevronRightIcon className="size-4" />
            )
          ) : (
            "\u00A0"
          )}
        </span>

        <FolderIcon className="fill-warning text-warning size-4" />
        <span className="truncate">{node.folder.name}</span>
      </div>

      {node.open &&
        node.children.map((child) => (
          <FolderRow
            key={child.folder.id}
            node={child}
            depth={depth + 1}
            excludeId={excludeId}
            selected={selected}
            onSelect={onSelect}
            onToggle={onToggle}
            onLoadChildren={onLoadChildren}
          />
        ))}
    </>
  );
}

export default function FolderPicker({ excludeId, value, onChange }: Props) {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);

  const toNode = (f: Folder): TreeNode => ({
    folder: f,
    children: [],
    loaded: false,
    open: false,
    loading: false,
  });

  useEffect(() => {
    (async () => {
      setLoading(true);

      const res = await get<Folder[]>({
        path: "/folders",
      });

      if (res.status === "success") {
        const nodes = res.data.map(toNode);
        setNodes(nodes);
      }

      if (res.status === "error") {
        console.error("Failed to load folders", res.message);
      }

      setLoading(false);
    })();
  }, []);

  const loadChildren = useCallback(async (parentId: string) => {
    setNodes((prev) => setNodeLoading(prev, parentId, true));

    const res = await get<Folder[]>({
      path: "/folders",
      query: { parentId },
    });

    if (res.status === "success") {
      const children = res.data.map(toNode);
      setNodes((prev) => updateTree(prev, parentId, children));
    }

    if (res.status === "error") {
      console.error("Failed to load folders", res.message);
      setNodes((prev) => setNodeLoading(prev, parentId, false));
    }
  }, []);

  const toggleNode = useCallback((id: string) => {
    setNodes((prev) => toggleInTree(prev, id));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-6">
        <div className="w-5 h-5 rounded-full border-2 animate-spin border-accent border-t-transparent" />
      </div>
    );

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="max-h-56 overflow-y-auto p-2">
        {/* Root option */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all"
          style={{
            background: value === null ? "var(--color-accent-dim)" : "transparent",
            color: value === null ? "var(--color-accent)" : "var(--color-text-muted)",
            border: value === null ? "1px solid rgba(56,189,248,0.2)" : "1px solid transparent",
          }}
          onClick={() => onChange(null)}
        >
          <span style={{ width: 16 }} />
          <HomeIcon className="text-current size-4" />
          Root
        </div>

        {nodes.length === 0 && <p className="text-xs px-3 py-2 text-text-muted">No folders yet.</p>}

        {nodes.map((node) => (
          <FolderRow
            key={node.folder.id}
            node={node}
            depth={0}
            excludeId={excludeId}
            selected={value}
            onSelect={onChange}
            onToggle={toggleNode}
            onLoadChildren={loadChildren}
          />
        ))}
      </div>
    </div>
  );
}

// Immutable tree helpers
function updateTree(nodes: TreeNode[], parentId: string, children: TreeNode[]): TreeNode[] {
  return nodes.map((n) => {
    if (n.folder.id === parentId) return { ...n, children, loaded: true, loading: false };
    if (n.children.length) return { ...n, children: updateTree(n.children, parentId, children) };
    return n;
  });
}

function toggleInTree(nodes: TreeNode[], id: string): TreeNode[] {
  return nodes.map((n) => {
    if (n.folder.id === id) return { ...n, open: !n.open };
    if (n.children.length) return { ...n, children: toggleInTree(n.children, id) };
    return n;
  });
}

function setNodeLoading(nodes: TreeNode[], id: string, loading: boolean): TreeNode[] {
  return nodes.map((n) => {
    if (n.folder.id === id) return { ...n, loading };
    if (n.children.length) return { ...n, children: setNodeLoading(n.children, id, loading) };
    return n;
  });
}
