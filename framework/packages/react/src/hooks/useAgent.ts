import { useState, useCallback } from "react";

export interface UseAgentOptions {
  apiUrl: string;
  onError?: (error: Error) => void;
}

export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface UseAgentResult {
  messages: AgentMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for simple agent interactions
 *
 * @example
 * ```tsx
 * function Chat() {
 *   const { messages, sendMessage, isLoading } = useAgent({
 *     apiUrl: "/api/agent"
 *   });
 *
 *   return (
 *     <div>
 *       {messages.map((msg, i) => (
 *         <div key={i}>{msg.role}: {msg.content}</div>
 *       ))}
 *       <input
 *         onSubmit={(e) => sendMessage(e.target.value)}
 *         disabled={isLoading}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function useAgent(options: UseAgentOptions): UseAgentResult {
  const { apiUrl, onError } = options;
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: AgentMessage = {
        role: "user",
        content,
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: content })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const assistantContent =
          data.response?.choices?.[0]?.message?.content || data.content || "No response";

        const assistantMessage: AgentMessage = {
          role: "assistant",
          content: assistantContent,
          timestamp: Date.now()
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, onError]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    reset
  };
}
