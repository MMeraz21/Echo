"use client";
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import React, { useState, useRef, useEffect } from "react";
import { DataPacket_Kind, Room, Participant } from "livekit-client";
import { useTranscription } from "@/hooks/useTranscription";
import { ChatMessage } from "./ChatMessage";

export interface BaseChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  type: "chat" | "transcription";
}

export interface UserChatMessage extends BaseChatMessage {
  type: "chat";
  text: string;
}

export interface TranscriptionChatMessage extends BaseChatMessage {
  type: "transcription";
  text: string;
}

type ChatMessage = UserChatMessage | TranscriptionChatMessage;

interface ChatData {
  text: string;
  timestamp: string;
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
  console.log("ChatPanel component starting to render");

  try {
    const [messageInput, setMessageInput] = useState(""); //chat input
    console.log("ChatPanel - after useState");

    const room = useRoomContext();
    console.log("ChatPanel - room context:", room ? "exists" : "null");

    const { transcriptions } = useTranscription();
    console.log("ChatPanel - transcriptions:", transcriptions);

    const [localMessages, setLocalMessages] = useState<ChatMessage[]>([
      //added demo message
      {
        id: "1",
        sender: "System",
        text: "Welcome to the chat! Click the microphone button to start transcription.",
        timestamp: new Date(),
        type: "chat",
      },
    ]);
    console.log("ChatPanel - after all hooks");

    useEffect(() => {
      if (transcriptions.length > 0) {
        const lastTranscription = transcriptions[transcriptions.length - 1];
        if (lastTranscription) {
          console.log(
            "ChatPanel - Adding new transcription to messages:",
            lastTranscription,
          );
          setLocalMessages((prev) => {
            const newMessage: TranscriptionChatMessage = {
              id: Date.now().toString(),
              sender: "Transcription",
              text: lastTranscription,
              timestamp: new Date(),
              type: "transcription",
            };
            console.log("ChatPanel - Current messages:", prev);
            console.log("ChatPanel - Adding message:", newMessage);
            return [...prev, newMessage];
          });
        }
      }
    }, [transcriptions]);

    useEffect(() => {
      if (!room) return;

      const handleData = (payload: Uint8Array, participant?: Participant) => {
        const decoder = new TextDecoder();
        const message = JSON.parse(decoder.decode(payload)) as ChatData;

        setLocalMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: participant?.identity ?? "Unknown",
            text: message.text,
            timestamp: new Date(message.timestamp),
            type: "chat",
          },
        ]);
      };

      room.on("dataReceived", handleData);

      return () => {
        room.off("dataReceived", handleData);
      };
    }, [room]);

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
      if (!messageInput.trim() || !room) return;

      const message = {
        text: messageInput.trim(),
        timestamp: new Date().toISOString(),
      };

      // Send message through LiveKit's data channel
      const encoder = new TextEncoder();
      void room.localParticipant.publishData(
        encoder.encode(JSON.stringify(message)),
        { reliable: true },
      );

      // Add message to local state
      setLocalMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "You",
          text: messageInput.trim(),
          timestamp: new Date(),
          type: "chat",
        },
      ]);

      setMessageInput("");
    };

    // Format timestamp for chat messages
    const formatTime = (date: Date): string => {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
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
              <ChatMessage
                key={message.id}
                message={message}
                formatTime={formatTime}
              />
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
  } catch (error) {
    console.error("Error in ChatPanel render:", error);
    throw error; // Re-throw to be caught by error boundary
  }
}
