import { useState, useCallback, useRef } from "react";
import type { AgentMessage } from "./useAgent.js";

export interface UseStreamingAgentOptions {
  apiUrl: string;
  onError?: (error: Error) => void;
  onChunk?: (chunk: string) => void;
}

export interface UseStreamingAgentResult {
  messages: AgentMessage[];
  isStreaming: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
  reset: () => void;
}

/**
 * Hook for streaming agent responses
 * Perfect for real-time chat experiences
 *
 * @example
 * ```tsx
 * function StreamingChat() {
 *   const { messages, sendMessage, isStreaming } = useStreamingAgent({
 *     apiUrl: "/api/agent/stream"
 *   });
 *
 *   return (
 *     <div>
 *       {messages.map((msg, i) => (
 *         <div key={i} className={msg.role}>
 *           {msg.content}
 *         </div>
 *       ))}
 *       {isStreaming && <div>...</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useStreamingAgent(options: UseStreamingAgentOptions): UseStreamingAgentResult {
  const { apiUrl, onError, onChunk } = options;
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: AgentMessage = {
        role: "user",
        content,
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setError(null);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: content, stream: true }),
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Response body is not readable");
        }

        const decoder = new TextDecoder();
        let assistantContent = "";

        // Add placeholder for assistant message
        const assistantMessage: AgentMessage = {
          role: "assistant",
          content: "",
          timestamp: Date.now()
        };
        setMessages((prev) => [...prev, assistantMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;

          // Update the last message (assistant) with new content
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: assistantContent
            };
            return updated;
          });

          onChunk?.(chunk);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // User cancelled - not an error
          return;
        }

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [apiUrl, onError, onChunk]
  );

  const reset = useCallback(() => {
    stopStreaming();
    setMessages([]);
    setError(null);
  }, [stopStreaming]);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    reset
  };
}
