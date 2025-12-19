import { ChatRequest } from "./openai-client.js";

export type RouteInput = {
  intent?: "classification" | "extraction" | "planning" | "creative";
  prompt: string;
  request: ChatRequest;
};

export type RouteResult = {
  model: string;
  reason: string;
};

export type RouterRule = {
  name: string;
  matcher: (input: RouteInput) => boolean | Promise<boolean>;
  model: string;
  reason?: string;
};

export type RouterConfig = {
  defaultModel: string;
  rules?: RouterRule[];
};

export async function routeModel(input: RouteInput, config: RouterConfig): Promise<RouteResult> {
  for (const rule of config.rules ?? []) {
    const matched = await rule.matcher(input);
    if (matched) {
      return { model: rule.model, reason: rule.reason ?? `rule:${rule.name}` };
    }
  }

  return { model: config.defaultModel, reason: "default" };
}
