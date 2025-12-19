import { ChatMessage } from "@runmesh/core";

export type PolicyContext = {
  agent: string;
  messages: ChatMessage[];
};

export type PolicyResult = { allow: boolean; reason?: string };

export type Policy = (context: PolicyContext) => PolicyResult | Promise<PolicyResult>;

export async function enforcePolicies(
  policies: Policy[] | undefined,
  context: PolicyContext
): Promise<void> {
  if (!policies?.length) return;

  for (const policy of policies) {
    const result = await policy(context);
    if (!result.allow) {
      const reason = result.reason ?? "Policy rejected the request";
      throw new Error(reason);
    }
  }
}
