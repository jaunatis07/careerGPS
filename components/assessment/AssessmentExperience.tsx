"use client";

import { useMemo, useState } from "react";

import { submitAssessment } from "@/app/(dashboard)/assessment/actions";
import { AssessmentQuiz } from "@/components/assessment/AssessmentQuiz";
import { AssessmentResult } from "@/components/assessment/AssessmentResult";
import { CareerSuggestionCard } from "@/components/assessment/CareerSuggestionCard";
import { ProfileBasicsSection } from "@/components/assessment/ProfileBasicsSection";
import { Button } from "@/components/ui/button";
import { isAssessmentComplete } from "@/lib/assessment/calculate-tags";

interface InitialProfile {
  mbti: string | null;
  holland: string | null;
  assessment_tags: string[] | null;
}

interface AssessmentExperienceProps {
  initialProfile: InitialProfile | null;
}

type AssessmentPhase = "quiz" | "result";

/**
 * 自我探索测评主流程：可选 MBTI/霍兰德录入 + 12 题交互 + 结果提交与展示。
 */
export function AssessmentExperience({
  initialProfile,
}: AssessmentExperienceProps) {
  const hasExistingResult =
    Array.isArray(initialProfile?.assessment_tags) &&
    initialProfile.assessment_tags.length > 0;

  const [phase, setPhase] = useState<AssessmentPhase>(
    hasExistingResult ? "result" : "quiz",
  );
  const [mbti, setMbti] = useState(initialProfile?.mbti ?? "");
  const [holland, setHolland] = useState(initialProfile?.holland ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resultTags, setResultTags] = useState<string[]>(
    initialProfile?.assessment_tags ?? [],
  );
  const [savedMbti, setSavedMbti] = useState<string | null>(
    initialProfile?.mbti ?? null,
  );
  const [savedHolland, setSavedHolland] = useState<string | null>(
    initialProfile?.holland ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allAnswered = useMemo(
    () => isAssessmentComplete(answers),
    [answers],
  );

  function handleAnswerChange(questionId: string, optionId: string) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionId,
    }));
  }

  function handleRetake() {
    setPhase("quiz");
    setAnswers({});
    setCurrentIndex(0);
    setError(null);
  }

  async function handleSubmit() {
    setError(null);

    if (!allAnswered) {
      setError("请完成全部 12 道题目后再提交");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitAssessment({
        mbti,
        holland,
        answers,
      });

      setResultTags(result.tags);
      setSavedMbti(result.mbti);
      setSavedHolland(result.holland);
      setPhase("result");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "提交失败，请稍后重试",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <ProfileBasicsSection
        mbti={mbti}
        holland={holland}
        onMbtiChange={setMbti}
        onHollandChange={setHolland}
        disabled={phase === "result" && !isSubmitting}
      />

      {phase === "quiz" ? (
        <AssessmentQuiz
          currentIndex={currentIndex}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          onPrevious={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
          onNext={() =>
            setCurrentIndex((index) => Math.min(index + 1, 11))
          }
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      ) : (
        <>
          <AssessmentResult
            tags={resultTags}
            mbti={savedMbti}
            holland={savedHolland}
          />
          <CareerSuggestionCard
            tags={resultTags}
            mbti={savedMbti}
            holland={savedHolland}
          />
          <Button type="button" variant="outline" onClick={handleRetake}>
            重新测评
          </Button>
        </>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
