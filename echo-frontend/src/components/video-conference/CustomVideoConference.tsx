"use client";

import React, { useMemo, useState, useCallback } from "react";
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
import { ChatPanel, type ChatMessage } from "./ChatPanel";

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

  // Fixed width for the chat panel
  const CHAT_PANEL_WIDTH = 320; // Reduced from 400px

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Main content with video */}
      <div
        className="lk-video-conference flex h-full flex-col bg-black"
        style={{ width: `calc(100% - ${CHAT_PANEL_WIDTH}px)` }}
      >
        {/* Remote participants - flex-grow to take available space */}
        <div className="flex min-h-0 flex-1 items-center justify-center">
          {/* Container to limit video size */}
          <div className="mx-auto w-full max-w-3xl px-4">
            <GridLayout
              tracks={tracksResult.filter((t) => {
                // This performs the same filtering logic but keeps the original track objects
                const track = t as unknown;
                if (!isSafeTrack(track)) return false;
                return !track.participant.isLocal;
              })}
              className="h-full"
              style={{
                maxHeight: "80%", // Limit the maximum height of videos
                margin: "0 auto",
              }}
            >
              <ParticipantTile />
            </GridLayout>
          </div>

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

      {/* Chat panel with fixed width in its own container */}
      <div className="h-full" style={{ width: `${CHAT_PANEL_WIDTH}px` }}>
        <ChatPanel />
      </div>
    </div>
  );
}
