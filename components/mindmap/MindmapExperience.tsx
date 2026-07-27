"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { CareerMindmap } from "@/components/mindmap/CareerMindmap";
import { JobInsightPanel } from "@/components/mindmap/JobInsightPanel";
import { CAREER_TREE, getAllLeafLabels } from "@/lib/constants/career-tree";
import { syncSavedJobsWithServer } from "@/lib/client/saved-jobs";

const VALID_JOB_TITLES = getAllLeafLabels();

/**
 * 岗位全景页客户端容器：协调思维导图与半屏岗位透视面板。
 */
export function MindmapExperience() {
  const searchParams = useSearchParams();
  const jobFromQuery = searchParams.get("job");

  const initialJob =
    jobFromQuery && VALID_JOB_TITLES.includes(jobFromQuery)
      ? jobFromQuery
      : null;

  const [selectedJob, setSelectedJob] = useState<string | null>(initialJob);
  const [panelOpen, setPanelOpen] = useState(Boolean(initialJob));

  useEffect(() => {
    if (jobFromQuery && VALID_JOB_TITLES.includes(jobFromQuery)) {
      setSelectedJob(jobFromQuery);
      setPanelOpen(true);
    }
  }, [jobFromQuery]);

  useEffect(() => {
    void syncSavedJobsWithServer();
  }, []);

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
