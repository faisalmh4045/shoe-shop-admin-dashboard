import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";

import { requireAdmin } from "@/dal/auth.dal";
import { model } from "@/lib/ai/model";
import { chatSystemPrompt } from "@/lib/ai/system-prompt";
import { chatTools } from "@/lib/ai/tools";

export async function POST(req: Request) {
  await requireAdmin();

  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    const messages = body.messages ?? [];

    const result = streamText({
      model,
      system: chatSystemPrompt,
      messages: await convertToModelMessages(messages),
      tools: chatTools,
      stopWhen: stepCountIs(2),
      maxOutputTokens: 512,
    });

    return result.toUIMessageStreamResponse();
  } catch {
    return new Response("An unexpected error occurred.", { status: 500 });
  }
}
