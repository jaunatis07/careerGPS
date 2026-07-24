"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isCareerLeaf } from "@/lib/constants/career-tree";
import type { CareerNode } from "@/types";

interface CareerTreeNodeProps {
  node: CareerNode;
  depth?: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectJob: (title: string) => void;
  selectedJob?: string | null;
}

/**
 * 递归渲染职业树节点，支持展开/折叠与末端岗位点击。
 */
export function CareerTreeNode({
  node,
  depth = 0,
  expandedIds,
  onToggle,
  onSelectJob,
  selectedJob,
}: CareerTreeNodeProps) {
  const isLeaf = isCareerLeaf(node);
  const isExpanded = expandedIds.has(node.id);
  const isSelected = isLeaf && selectedJob === node.label;

  if (isLeaf) {
    return (
      <div style={{ paddingLeft: `${depth * 16}px` }}>
        <Button
          type="button"
          variant={isSelected ? "default" : "outline"}
          size="sm"
          className="mb-2 h-8 w-full justify-start font-normal sm:w-auto sm:min-w-40"
          onClick={() => onSelectJob(node.label)}
        >
          {node.label}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium transition-colors hover:bg-muted",
          depth === 0 && "text-base",
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onToggle(node.id)}
      >
        {isExpanded ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span>{node.label}</span>
      </button>

      {isExpanded ? (
        <div className="space-y-1 border-l border-border/70 ml-4">
          {node.children?.map((child) => (
            <CareerTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelectJob={onSelectJob}
              selectedJob={selectedJob}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface CareerMindmapProps {
  tree: CareerNode[];
  onSelectJob: (title: string) => void;
  selectedJob?: string | null;
}

/**
 * 岗位全景思维导图容器：管理展开状态并渲染整棵树。
 */
export function CareerMindmap({
  tree,
  onSelectJob,
  selectedJob,
}: CareerMindmapProps) {
  const defaultExpandedIds = useMemo(
    () => new Set(tree.map((node) => node.id)),
    [tree],
  );
  const [expandedIds, setExpandedIds] =
    useState<Set<string>>(defaultExpandedIds);

  function handleToggle(id: string) {
    setExpandedIds((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          点击分类展开/折叠，点击末端岗位查看 AI 透视卡片
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpandedIds(new Set(defaultExpandedIds))}
        >
          重置展开
        </Button>
      </div>

      <div className="space-y-2">
        {tree.map((node) => (
          <CareerTreeNode
            key={node.id}
            node={node}
            expandedIds={expandedIds}
            onToggle={handleToggle}
            onSelectJob={onSelectJob}
            selectedJob={selectedJob}
          />
        ))}
      </div>
    </div>
  );
}
