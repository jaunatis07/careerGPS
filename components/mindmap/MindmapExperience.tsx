"use client";

import { useState } from "react";

import { CareerMindmap } from "@/components/mindmap/CareerMindmap";
import { JobInsightPanel } from "@/components/mindmap/JobInsightPanel";
import { CAREER_TREE } from "@/lib/constants/career-tree";

/**
 * 岗位全景页客户端容器：协调思维导图与半屏岗位透视面板。
 */
export function MindmapExperience() {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  function handleSelectJob(title: string) {
    setSelectedJob(title);
    setPanelOpen(true);
  }

  return (
    <>
      <CareerMindmap
        tree={CAREER_TREE}
        selectedJob={selectedJob}
        onSelectJob={handleSelectJob}
      />
      <JobInsightPanel
        jobTitle={selectedJob}
        open={panelOpen}
        onOpenChange={setPanelOpen}
      />
    </>
  );
}
