import { ChatSystem } from "@/components/chat/chat-system";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat - HikariCha Forum",
  description: "Connect with friends and community members through real-time messaging on HikariCha Forum.",
};

export default function ChatPage() {
  return (
    <div className="h-screen bg-background">
      <ChatSystem />
    </div>
  );
}