import React from "react";
import type { ChatMessage as ChatMessageType } from "./types";

interface ChatMessageProps {
  message: ChatMessageType;
  formatTime: (date: Date) => string;
  handleTranslate: (message: string) => void;
}

export function ChatMessage({
  message,
  formatTime,
  handleTranslate,
}: ChatMessageProps): React.ReactElement {
  return (
    <div
      key={message.id}
      className={`flex flex-col ${
        message.sender === "You" ? "items-end" : "items-start"
      }`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-400">
          {message.sender}
          {message.type === "transcription" && (
            <span className="ml-2">(Transcription)</span>
          )}
        </span>
        <span className="text-xs text-gray-500">
          {formatTime(message.timestamp)}
        </span>
      </div>
      <div
        className={`group relative mt-1 max-w-[85%] rounded-lg px-4 py-3 ${message.type === "transcription" ? "italic" : ""} ${
          message.sender === "You"
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-gray-100"
        }`}
      >
        <div className="absolute inset-0 rounded-lg bg-black opacity-0 transition-opacity group-hover:opacity-20" />

        {message.type === "transcription" && (
          <button
            onClick={() => handleTranslate(message.text)}
            className="absolute -top-2 -right-2 flex items-center justify-center rounded-lg bg-gray-800 p-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 hover:bg-gray-900"
            aria-label="Translate message"
          >
            文A
          </button>
        )}

        <span className="relative z-10">{message.text}</span>
      </div>
    </div>
  );
}
