"use client";

import { Fragment, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { MessageSquareIcon } from "lucide-react";

import {
  Conversation,
  ConversationEmptyState,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Spinner } from "@/components/ui/spinner";

const suggestions = [
  "How's revenue this month?",
  "Are we getting more orders than last week?",
  "Which day do we sell most?",
  "Which products are low stock under 10?",
  "How many new customers this week?",
];

export function ChatInterface() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInput("");
  };

  const sendStarter = (text: string) => {
    if (isLoading) return;
    sendMessage({ text });
  };

  return (
    <div className="relative flex h-full w-full flex-col rounded-lg border p-3">
      <div className="flex h-full flex-col">
        <Conversation>
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquareIcon className="size-6" />}
                title="Business Intelligence Assistant"
                description="Ask questions about orders, revenue, customers, or inventory."
              />
            ) : (
              messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <Fragment key={`${message.id}-${i}`}>
                              <MessageResponse>{part.text}</MessageResponse>
                            </Fragment>
                          );
                        default:
                          return null;
                      }
                    })}
                  </MessageContent>
                </Message>
              ))
            )}

            {isLoading ? <Spinner /> : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <Suggestions className="py-4">
          {suggestions.map((suggestion) => (
            <Suggestion
              key={suggestion}
              onClick={sendStarter}
              suggestion={suggestion}
            />
          ))}
        </Suggestions>

        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            value={input}
            placeholder="Ask a question…"
            onChange={(e) => setInput(e.currentTarget.value)}
            disabled={isLoading}
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit
              status={isLoading ? "streaming" : "ready"}
              disabled={!input.trim()}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
