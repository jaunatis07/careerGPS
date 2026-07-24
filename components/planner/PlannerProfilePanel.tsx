"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { savePlannerProfile } from "@/app/(dashboard)/planner/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GRADE_LEVEL_OPTIONS } from "@/lib/constants/planner";
import type { PlannerProfile } from "@/lib/constants/planner";
import { cn } from "@/lib/utils";

interface PlannerProfilePanelProps {
  profile: PlannerProfile;
}

/**
 * Planner 用户档案面板：年级、目标岗位编辑，供 System Prompt 注入。
 */
export function PlannerProfilePanel({ profile }: PlannerProfilePanelProps) {
  const [gradeLevel, setGradeLevel] = useState(profile.grade_level ?? "");
  const [targetRole, setTargetRole] = useState(profile.target_role ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      try {
        setMessage(null);
        await savePlannerProfile({ gradeLevel, targetRole });
        setMessage("已保存，后续对话将自动引用最新档案");
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "保存失败，请重试",
        );
      }
    });
  }

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">规划档案</h2>
        <p className="text-xs text-muted-foreground">
          填写后 AI 会结合你的年级与目标岗位给出分阶段建议
        </p>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="grade-level">当前年级</Label>
          <select
            id="grade-level"
            value={gradeLevel}
            disabled={isPending}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            onChange={(event) => setGradeLevel(event.target.value)}
          >
            <option value="">请选择年级</option>
            {GRADE_LEVEL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="target-role">目标岗位</Label>
          <Input
            id="target-role"
            placeholder="如：AI产品经理"
            value={targetRole}
            disabled={isPending}
            onChange={(event) => setTargetRole(event.target.value)}
          />
        </div>

        <Button
          type="button"
          className="w-full"
          disabled={isPending}
          onClick={handleSave}
        >
          {isPending ? "保存中..." : "保存档案"}
        </Button>

        {message ? (
          <p
            className={cn(
              "text-xs",
              message.includes("已保存")
                ? "text-green-600 dark:text-green-400"
                : "text-destructive",
            )}
          >
            {message}
          </p>
        ) : null}
      </div>

      <div className="mt-5 space-y-2 border-t pt-4">
        <p className="text-xs font-medium text-muted-foreground">测评上下文</p>
        <div className="flex flex-wrap gap-2 text-xs">
          {profile.mbti ? <Badge variant="secondary">MBTI {profile.mbti}</Badge> : null}
          {profile.holland ? (
            <Badge variant="secondary">霍兰德 {profile.holland}</Badge>
          ) : null}
          {profile.assessment_tags.length > 0 ? (
            profile.assessment_tags.map((tag) => (
              <Badge key={tag} variant="outline">
                [{tag}]
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">暂无测评标签</span>
          )}
        </div>
        {profile.assessment_tags.length === 0 ? (
          <Link
            href="/assessment"
            className="inline-block text-xs text-primary hover:underline"
          >
            前往完成 12 题测评 →
          </Link>
        ) : null}
      </div>
    </section>
  );
}
