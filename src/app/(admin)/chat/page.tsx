import { ChatInterface } from "@/components/chat/chat-interface";
import { requireAdmin } from "@/dal/auth.dal";

export default async function ChatPage() {
  await requireAdmin();

  return (
    <div className="flex h-[93dvh] flex-col p-4 lg:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">BI Chat</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ask questions about your store data
      </p>
      <div className="mt-4 flex min-h-0 flex-1">
        <ChatInterface />
      </div>
    </div>
  );
}
