export interface BaseChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  translation: string;
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

export type ChatMessage = UserChatMessage | TranscriptionChatMessage;

export interface ChatData {
  text: string;
  timestamp: string;
}
