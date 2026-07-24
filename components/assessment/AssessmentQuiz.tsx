"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ASSESSMENT_DIMENSION_LABELS,
  ASSESSMENT_QUESTIONS,
} from "@/lib/constants/assessment-questions";
import { cn } from "@/lib/utils";

interface AssessmentQuizProps {
  currentIndex: number;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, optionId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

/**
 * 12 题单选题交互流程：逐题展示、进度条与上一题/下一题导航。
 */
export function AssessmentQuiz({
  currentIndex,
  answers,
  onAnswerChange,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting = false,
}: AssessmentQuizProps) {
  const question = ASSESSMENT_QUESTIONS[currentIndex];
  const total = ASSESSMENT_QUESTIONS.length;
  const answeredCount = ASSESSMENT_QUESTIONS.filter((item) =>
    Boolean(answers[item.id]),
  ).length;
  const progressValue = Math.round((answeredCount / total) * 100);
  const selectedOptionId = answers[question.id];
  const isLastQuestion = currentIndex === total - 1;
  const canGoNext = Boolean(selectedOptionId);

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium">
            第 {currentIndex + 1} / {total} 题
          </span>
          <span className="text-muted-foreground">
            {ASSESSMENT_DIMENSION_LABELS[question.dimension]}
          </span>
        </div>
        <Progress value={progressValue} />
        <p className="text-xs text-muted-foreground">
          已完成 {answeredCount} 题（{progressValue}%）
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <h3 className="text-base font-medium leading-relaxed">
          {question.questionText}
        </h3>

        <RadioGroup
          value={selectedOptionId ?? null}
          onValueChange={(value) => {
            if (value) {
              onAnswerChange(question.id, value);
            }
          }}
          className="gap-3"
        >
          {question.options.map((option) => {
            const isSelected = selectedOptionId === option.id;

            return (
              <label
                key={option.id}
                htmlFor={option.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50",
                )}
              >
                <RadioGroupItem id={option.id} value={option.id} />
                <div className="space-y-1 pt-0.5">
                  <Label htmlFor={option.id} className="cursor-pointer font-normal">
                    {option.text}
                  </Label>
                </div>
              </label>
            );
          })}
        </RadioGroup>
      </div>

      <div className="mt-6 flex flex-wrap justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={currentIndex === 0 || isSubmitting}
          onClick={onPrevious}
        >
          上一题
        </Button>

        {isLastQuestion ? (
          <Button
            type="button"
            disabled={!canGoNext || isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting ? "提交中..." : "提交并生成标签"}
          </Button>
        ) : (
          <Button type="button" disabled={!canGoNext} onClick={onNext}>
            下一题
          </Button>
        )}
      </div>
    </section>
  );
}
