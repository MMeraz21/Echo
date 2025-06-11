"use client";
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import React, { useState, useRef, useEffect } from "react";
import { DataPacket_Kind, Room, Participant } from "livekit-client";
import { useTranscription } from "@/hooks/useTranscription";
import { ChatMessage as ChatMessageComponent } from "./ChatMessage";
import type { ChatMessage, ChatData, TranscriptionChatMessage } from "./types";
import { v4 as uuidv4 } from "uuid";

export interface ChatPanelProps {
  className?: string;
  style?: React.CSSProperties;
  onSendMessage?: (message: string) => void;
  messages?: ChatMessage[];
}

interface TranslationResponse {
  detectedLanguage: {
    language: string;
    score: number;
  };
  translations: {
    text: string;
    to: string;
  }[];
}

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
] as const;

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
    const [targetLanguage, setTargetLanguage] = useState("en");

    console.log("ChatPanel - after useState");

    const room = useRoomContext();
    console.log("ChatPanel - room context:", room ? "exists" : "null");

    const { transcriptions } = useTranscription();
    console.log("ChatPanel - transcriptions:", transcriptions);

    const [localMessages, setLocalMessages] = useState<ChatMessage[]>([
      {
        id: "1",
        sender: "System",
        text: "Welcome to the chat! Click the microphone button to start transcription.",
        timestamp: new Date(),
        type: "chat",
        translation: "",
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

          const message: ChatData = {
            text: lastTranscription,
            timestamp: new Date().toISOString(),
            type: "transcription",
          };

          const encoder = new TextEncoder();
          void room.localParticipant.publishData(
            encoder.encode(JSON.stringify(message)),
            { reliable: true },
          );

          setLocalMessages((prev) => {
            const newMessage: TranscriptionChatMessage = {
              id: uuidv4().toString(),
              sender: "You",
              text: lastTranscription,
              timestamp: new Date(),
              type: "transcription",
              translation: "",
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
        console.log("Data received from participant:", participant?.identity);
        const decoder = new TextDecoder();
        const rawData = decoder.decode(payload);
        console.log("Raw decoded data:", rawData);

        try {
          const message = JSON.parse(rawData) as ChatData;
          console.log("Parsed message:", message);
          console.log("Message type:", message.type);

          setLocalMessages((prev) => {
            const newMessage = {
              id: uuidv4().toString(),
              sender: participant?.identity ?? "Unknown",
              text: message.text,
              timestamp: new Date(message.timestamp),
              type: message.type ?? "chat",
              translation: "",
            };
            console.log("Creating new message with type:", newMessage.type);
            return [...prev, newMessage];
          });
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      room.on("dataReceived", handleData);

      return () => {
        room.off("dataReceived", handleData);
      };
    }, [room]);

    const displayMessages = messages.length > 0 ? messages : localMessages;

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      // Use requestAnimationFrame for more reliable scroll after DOM update
      const raf = requestAnimationFrame(() => {
        if (chatEndRef.current) {
          console.log("Scrolling to bottom, messages:", displayMessages.length);
          chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      });
      return () => cancelAnimationFrame(raf);
    }, [displayMessages]);

    const handleTranslate = async (messageId: string, message: string) => {
      console.log("Translating message:", message);
      const endpoint = "https://api.cognitive.microsofttranslator.com";
      const key = process.env.NEXT_PUBLIC_TRANSLATOR_KEY;
      const region = process.env.NEXT_PUBLIC_TRANSLATOR_REGION;

      try {
        const response = await fetch(
          `${endpoint}/translate?api-version=3.0&to=${targetLanguage}`,
          {
            method: "POST",
            headers: {
              "Ocp-Apim-Subscription-Key": key!,
              "Ocp-Apim-Subscription-Region": region!,
              "Content-Type": "application/json",
            },
            body: JSON.stringify([{ Text: message }]),
          },
        );

        const data = (await response.json()) as TranslationResponse[];
        const translation =
          data[0]?.translations?.[0]?.text ?? "Translation failed";
        const detectedLanguage =
          data[0]?.detectedLanguage?.language ?? "unknown";

        setLocalMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, translation: translation } : msg,
          ),
        );

        console.log("Translation:", translation);
        console.log("Detected language:", detectedLanguage);
      } catch (error) {
        console.error("Error translating message:", error);
      }
    };

    const handleSendMessage = () => {
      if (!messageInput.trim() || !room) return;

      const message: ChatData = {
        text: messageInput.trim(),
        timestamp: new Date().toISOString(),
        type: "chat",
      };

      console.log("sending message with type:", message.type);

      const encoder = new TextEncoder(); //send message to livekit
      void room.localParticipant.publishData(
        encoder.encode(JSON.stringify(message)),
        { reliable: true },
      );

      setLocalMessages((prev) => [
        ...prev,
        {
          id: uuidv4().toString(),
          sender: "You",
          text: messageInput.trim(),
          timestamp: new Date(),
          type: "chat",
          translation: "",
        },
      ]);

      setMessageInput("");
    };

    const formatTime = (date: Date): string => {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

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
        <div className="absolute top-0 right-0 left-0 z-10 border-b border-gray-700">
          <div className="flex items-center gap-4 px-4 py-4">
            <h2 className="text-lg font-semibold text-white">Chat</h2>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <label
                htmlFor="language-select"
                className="text-sm text-gray-400"
              >
                Translate to:
              </label>
              <select
                id="language-select"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="rounded-lg border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option
                    key={lang.code}
                    value={lang.code}
                    className="flex items-center gap-2"
                  >
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Chat messages area - scrollable with absolute positioning */}
        <div className="absolute top-[60px] right-0 bottom-[72px] left-0 overflow-y-auto p-4">
          <div className="flex flex-col space-y-4 pt-2">
            {displayMessages.map((message) => (
              <ChatMessageComponent
                key={message.id}
                message={message}
                formatTime={formatTime}
                handleTranslate={handleTranslate}
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
