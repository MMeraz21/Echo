"use client";

import React, { useMemo, useState, useCallback, useRef } from "react";
import type { MouseEvent } from "react";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-core";
import {
  ParticipantTile,
  VideoTrack,
  RoomAudioRenderer,
  ConnectionStateToast,
  ControlBar,
  GridLayout,
  useTracks,
} from "@livekit/components-react";
import type { Participant, Track as TrackType } from "livekit-client";
import { Track } from "livekit-client";

// Type-safe wrapper for untyped track data
interface SafeParticipant {
  isLocal: boolean;
  identity?: string;
  sid?: string;
  name?: string;
}

// Our own safe representation of track data
interface SafeTrackReference {
  participant: SafeParticipant;
}

// Simple chat message interface
interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
}

/**
 * Type guard to safely check if an unknown object matches our SafeTrackReference structure
 */
function isSafeTrack(track: unknown): track is SafeTrackReference {
  if (track === null || typeof track !== "object") return false;

  // Use type narrowing safely
  const candidate = track as Record<string, unknown>;

  if (!("participant" in candidate)) return false;
  if (
    candidate.participant === null ||
    typeof candidate.participant !== "object"
  )
    return false;

  const participantCandidate = candidate.participant as Record<string, unknown>;
  return (
    "isLocal" in participantCandidate &&
    typeof participantCandidate.isLocal === "boolean"
  );
}

/**
 * Helper function to safely convert our SafeTrackReference to usable LiveKit components
 */
function createSafeTrackComponent(
  track: SafeTrackReference,
  Component: typeof VideoTrack | typeof ParticipantTile,
  props: Record<string, unknown> = {},
): React.ReactElement {
  // We create a safe wrapper to handle the conversion
  // This avoids direct type assertions in the JSX
  if (Component === VideoTrack) {
    // eslint-disable-next-line
    return <Component trackRef={track} {...props} />;
  }
  // For other components
  return <Component {...props} />;
}

export function CustomVideoConference(): React.ReactElement {
  // Get tracks with proper typing to satisfy ESLint
  const tracksResult = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
  ]);

  // Filter tracks safely using our type guard
  const cameraTracks = useMemo((): SafeTrackReference[] => {
    const untyped: unknown[] = tracksResult as unknown as unknown[];
    return untyped.filter(isSafeTrack);
  }, [tracksResult]);

  // Find local camera track
  const localCam = useMemo((): SafeTrackReference | undefined => {
    return cameraTracks.find((t) => t.participant.isLocal);
  }, [cameraTracks]);

  // Find remote camera tracks
  const remoteCams = useMemo((): SafeTrackReference[] => {
    return cameraTracks.filter((t) => !t.participant.isLocal);
  }, [cameraTracks]);

  // Track if local camera has been moved from default position
  const [showLocalCam, setShowLocalCam] = useState(true);
  const [useDefaultPosition, setUseDefaultPosition] = useState(true);
  const [localCamPosition, setLocalCamPosition] = useState({
    left: 0,
    top: 0,
  });

  // State for tracking drag operation
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "System",
      text: "Welcome to the chat! This is a demo chat interface.",
      timestamp: new Date(),
    },
  ]);
  const [messageInput, setMessageInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when messages change
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Handle sending a new chat message
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    setChatMessages([
      ...chatMessages,
      {
        id: Date.now().toString(),
        sender: "You", // In a real app, use the user's name
        text: messageInput.trim(),
        timestamp: new Date(),
      },
    ]);
    setMessageInput("");
  };

  // Start dragging the local camera view
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (!localCam) return;

      // Prevent default browser behavior
      e.preventDefault();
      e.stopPropagation();

      const element = e.currentTarget as HTMLDivElement;
      const rect = element.getBoundingClientRect();

      // If this is the first time dragging, set initial position based on current location
      if (useDefaultPosition) {
        setLocalCamPosition({
          left: rect.left,
          top: rect.top,
        });
        setUseDefaultPosition(false);
      }

      // Store initial mouse position
      setDragStart({ x: e.clientX, y: e.clientY });
      setIsDragging(true);
    },
    [localCam, useDefaultPosition],
  );

  // Handle mouse movement during drag
  const handleDragMove = useCallback(
    (e: globalThis.MouseEvent) => {
      if (!isDragging) return;

      // Calculate movement delta from drag start
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // Update position based on the delta from starting point
      setLocalCamPosition((prev) => ({
        left: prev.left + deltaX,
        top: prev.top + deltaY,
      }));

      // Update the drag start for the next move
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart],
  );

  // End the drag operation
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);

    // Keep position within viewport bounds
    setLocalCamPosition((prev) => ({
      left: Math.max(0, Math.min(prev.left, window.innerWidth - 160)), // 160px = width of video (40px * 4)
      top: Math.max(0, Math.min(prev.top, window.innerHeight - 112)), // 112px = height of video (28px * 4)
    }));
  }, []);

  // Attach drag handlers to document for smooth dragging across entire screen
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Format timestamp for chat messages
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex h-full w-full">
      {/* Main content with video and chat side by side */}
      <div
        className="lk-video-conference relative flex h-full flex-col bg-black"
        style={{ width: "calc(100% - 400px)" }} // Make video area narrower
      >
        {/* Remote participants */}
        <div className="flex-grow">
          {/* Use the original data that GridLayout expects */}
          <GridLayout
            tracks={tracksResult.filter((t) => {
              // This performs the same filtering logic but keeps the original track objects
              const track = t as unknown;
              if (!isSafeTrack(track)) return false;
              return !track.participant.isLocal;
            })}
            // Add custom styling for better video proportions with wider chat
            className="h-full"
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              padding: "0.5rem",
              height: "calc(100% - 2rem)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ParticipantTile />
          </GridLayout>

          {/* Local video PiP - Draggable */}
          {localCam && showLocalCam && (
            <div
              className="fixed h-28 w-40 overflow-hidden rounded-lg border border-white bg-black shadow-lg"
              style={{
                right: useDefaultPosition ? "1rem" : "auto",
                bottom: useDefaultPosition ? "1rem" : "auto",
                left: useDefaultPosition
                  ? "auto"
                  : `${localCamPosition.left}px`,
                top: useDefaultPosition ? "auto" : `${localCamPosition.top}px`,
                cursor: isDragging ? "grabbing" : "grab",
                zIndex: 999, // Higher z-index to be above other elements
              }}
              onMouseDown={handleDragStart}
              onClick={(e) => {
                // Capture click and prevent it from affecting other layers
                e.stopPropagation();
              }}
            >
              {/* Use the helper function to render safely */}
              {createSafeTrackComponent(localCam, VideoTrack)}

              {/* Controls for the local camera view */}
              <div className="absolute top-0 right-0 flex space-x-1 p-1">
                {/* Reset button - return to default position */}
                <button
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs text-white hover:bg-black/80"
                  title="Reset position"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUseDefaultPosition(true);
                  }}
                >
                  ↺
                </button>

                {/* Close button for testing in case it still gets stuck */}
                <button
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs text-white hover:bg-black/80"
                  title="Toggle visibility"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLocalCam(false);
                    setTimeout(() => setShowLocalCam(true), 100);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        <ControlBar
          controls={{
            microphone: true,
            camera: true,
            screenShare: false,
            chat: false,
            leave: true,
          }}
        />

        <RoomAudioRenderer />
        <ConnectionStateToast />
      </div>

      {/* Chat panel - wider for better readability */}
      <div
        className="flex h-full w-400 flex-col border-l border-gray-700 bg-gray-900"
        style={{ width: "400px" }}
      >
        <div className="border-b border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-white">Chat</h2>
        </div>

        {/* Chat messages area - larger area for messages */}
        <div className="flex-grow overflow-y-auto p-4">
          <div className="flex flex-col space-y-4">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.sender === "You" ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">
                    {message.sender}
                  </span>
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

        {/* Message input area - slightly larger */}
        <div className="border-t border-gray-700 p-4">
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
    </div>
  );
}
