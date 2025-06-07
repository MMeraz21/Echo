import React from "react";
import type { ChatMessage as ChatMessageType } from "./types";

interface ChatMessageProps {
  message: ChatMessageType;
  formatTime: (date: Date) => string;
}

export function ChatMessage({
  message,
  formatTime,
}: ChatMessageProps): React.ReactElement {
  return (
    <div
      key={message.id}
      className={`flex flex-col ${
        message.sender === "You" ? "items-end" : "items-start"
      }`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-400">{message.sender}</span>
        <span className="text-xs text-gray-500">
          {formatTime(message.timestamp)}
        </span>
      </div>
      <div
        className={`mt-1 max-w-[85%] rounded-lg px-4 py-3 ${
          message.sender === "You"
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-gray-100"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}
