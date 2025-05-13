"use client";

import React from "react";
import {
  ParticipantTile,
  RoomAudioRenderer,
  ConnectionStateToast,
  ControlBar,
  useLocalParticipant,
  useTracks,
  GridLayout,
  LayoutContextProvider,
  useCreateLayoutContext,
} from "@livekit/components-react";
import { Track } from "livekit-client";

/**
 * CustomVideoConference - A simplified version with:
 * - Basic video conference without screen sharing or chat
 * - Reserved space for a custom chat panel
 */
export function CustomVideoConference() {
  const layoutContext = useCreateLayoutContext();

  // Get camera tracks for all participants
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
  ]);

  return (
    <div className="lk-video-conference flex h-full w-full">
      <LayoutContextProvider value={layoutContext}>
        {/* Main content area (videos and controls) */}
        <div className="lk-video-conference-inner flex h-full flex-grow flex-col">
          {/* Video grid */}
          <div className="lk-grid-layout-wrapper flex-grow">
            <GridLayout tracks={tracks}>
              <ParticipantTile />
            </GridLayout>
          </div>

          {/* Control bar with limited controls */}
          <ControlBar
            controls={{
              microphone: true,
              camera: true,
              screenShare: false,
              chat: false,
              leave: true,
            }}
          />
        </div>
      </LayoutContextProvider>

      {/* Custom side panel for chat */}
      <div className="hidden w-80 border-l border-gray-200 bg-gray-100 md:block">
        <div className="h-full p-4">
          <h2 className="mb-4 text-lg font-semibold">Custom Chat Panel</h2>
          <p className="text-gray-500">
            You can implement your own chat interface here with complete control
            over its appearance and functionality.
          </p>
        </div>
      </div>

      <RoomAudioRenderer />
      <ConnectionStateToast />
    </div>
  );
}
