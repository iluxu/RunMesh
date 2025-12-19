export type Usage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type CostModel = {
  prompt: number;
  completion: number;
};

export function estimateCost(usage: Usage, model: CostModel): number {
  const promptCost = (usage.promptTokens ?? 0) * model.prompt;
  const completionCost = (usage.completionTokens ?? 0) * model.completion;
  return promptCost + completionCost;
}
