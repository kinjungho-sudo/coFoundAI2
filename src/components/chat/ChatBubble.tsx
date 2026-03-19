"use client";

import { Message } from "@/types";

interface ChatBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export default function ChatBubble({ message, isStreaming }: ChatBubbleProps) {
  const isAI = message.role === "ai";

  return (
    <div
      className={`flex ${isAI ? "justify-start" : "justify-end"} mb-4`}
    >
      {isAI && (
        <div className="w-8 h-8 rounded-full bg-[#534AB7] flex items-center justify-center text-xs font-bold text-white mr-3 flex-shrink-0 mt-1">
          AI
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isAI
            ? "bg-[#1A1927] text-[#E8E6F0] rounded-tl-none border border-[#2D2B42]"
            : "bg-[#534AB7] text-white rounded-tr-none"
        }`}
      >
        <p className="whitespace-pre-wrap">
          {message.content}
          {isStreaming && isAI && <span className="streaming-cursor" />}
        </p>
        {!isStreaming && (
          <p className={`text-xs mt-1 ${isAI ? "text-[#8B89A0]" : "text-purple-200"}`}>
            STEP {message.step}
          </p>
        )}
      </div>
    </div>
  );
}
