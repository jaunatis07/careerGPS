export class QuotaExceededError extends Error {
  constructor(message = "今日 AI 额度已用尽，请明日再试") {
    super(message);
    this.name = "QuotaExceededError";
  }
}
