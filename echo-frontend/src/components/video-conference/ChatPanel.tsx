"use client";

import React, { useState, useRef, useEffect } from "react";

// Chat message interface
export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
}

// Props for the ChatPanel component
export interface ChatPanelProps {
  className?: string;
  style?: React.CSSProperties;
  onSendMessage?: (message: string) => void;
  messages?: ChatMessage[];
}

/**
 * ChatPanel - A reusable chat component for video conferences
 */
export function ChatPanel({
  className = "",
  style = {},
  onSendMessage,
  messages = [],
}: ChatPanelProps): React.ReactElement {
  // Local state for the chat input
  const [messageInput, setMessageInput] = useState("");

  // Demo messages if none are provided
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "System",
      text: "Welcome to the chat! This is a demo chat interface.",
      timestamp: new Date(),
    },
  ]);

  // Determine which messages to display (props or local)
  const displayMessages = messages.length > 0 ? messages : localMessages;

  // Ref for auto-scrolling to bottom
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  // Handle sending a new chat message
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    // If parent component handles messages
    if (onSendMessage) {
      onSendMessage(messageInput.trim());
    } else {
      // Otherwise handle locally
      setLocalMessages([
        ...localMessages,
        {
          id: Date.now().toString(),
          sender: "You", // In a real app, use the user's name
          text: messageInput.trim(),
          timestamp: new Date(),
        },
      ]);
    }

    setMessageInput("");
  };

  // Format timestamp for chat messages
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Use absolute positioning for all internal elements to prevent growth
  return (
    <div
      className={`relative border-l border-gray-700 bg-gray-900 ${className}`}
      style={{
        height: "100%",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Header - fixed at top */}
      <div className="absolute top-0 right-0 left-0 z-10 border-b border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-white">Chat</h2>
      </div>

      {/* Chat messages area - scrollable with absolute positioning */}
      <div className="absolute top-[60px] right-0 bottom-[72px] left-0 overflow-y-auto p-4">
        <div className="flex flex-col space-y-4">
          {displayMessages.map((message) => (
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
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Message input area - fixed at bottom */}
      <div className="absolute right-0 bottom-0 left-0 border-t border-gray-700 p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-grow rounded-lg border border-gray-600 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleSendMessage}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
