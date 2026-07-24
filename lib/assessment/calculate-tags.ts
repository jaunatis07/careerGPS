import {
  ASSESSMENT_QUESTIONS,
  type AssessmentDimension,
} from "@/lib/constants/assessment-questions";

/**
 * 根据 12 道题的选项 ID，按维度投票并生成 4 个核心标签。
 */
export function calculateAssessmentTags(
  answers: Record<string, string>,
): string[] {
  const optionTagMap = new Map<string, string>();

  for (const question of ASSESSMENT_QUESTIONS) {
    for (const option of question.options) {
      optionTagMap.set(option.id, option.tag);
    }
  }

  const dimensionVotes: Record<AssessmentDimension, Record<string, number>> = {
    risk_stability: {},
    work_life_balance: {},
    ability_talent: {},
    tolerance_baseline: {},
  };

  for (const question of ASSESSMENT_QUESTIONS) {
    const selectedOptionId = answers[question.id];

    if (!selectedOptionId) {
      continue;
    }

    const tag = optionTagMap.get(selectedOptionId);

    if (!tag) {
      continue;
    }

    const votes = dimensionVotes[question.dimension];
    votes[tag] = (votes[tag] ?? 0) + 1;
  }

  const tags: string[] = [];

  for (const dimension of Object.keys(dimensionVotes) as AssessmentDimension[]) {
    const votes = dimensionVotes[dimension];
    const topTag = Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0];

    if (topTag) {
      tags.push(topTag);
    }
  }

  return tags;
}

/**
 * 校验是否 12 题全部作答。
 */
export function isAssessmentComplete(answers: Record<string, string>): boolean {
  return ASSESSMENT_QUESTIONS.every((question) => Boolean(answers[question.id]));
}
