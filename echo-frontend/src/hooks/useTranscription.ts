import { useEffect, useState, useCallback } from "react";
import { useLocalParticipant } from "@livekit/components-react";

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

interface TranscriptionData {
  type: string;
  session_id: string;
  created_at: string;
  data?: {
    id?: string;
    utterance?: {
      text: string;
      start: number;
      end: number;
      language: string;
    };
    byte_range?: [number, number];
    time_range?: [number, number];
  };
  error: null | string;
}

interface GladiaResponse {
  url: string;
  id: string;
}

export function useTranscription() {
  const { isMicrophoneEnabled } = useLocalParticipant();
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  console.log(
    "useTranscription hook - isMicrophoneEnabled:",
    isMicrophoneEnabled,
  );

  const initGladiaSession = async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GLADIA_API_KEY;
      if (!apiKey) {
        console.error("Gladia API key is missing");
        return null;
      }

      const response = await fetch("https://api.gladia.io/v2/live", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gladia-Key": apiKey,
        },
        body: JSON.stringify({
          encoding: "wav/pcm",
          sample_rate: 16000,
          bit_depth: 16,
          channels: 1,
        }),
      });

      if (!response.ok) {
        console.error(
          `Gladia init error: ${response.status}: ${await response.text()}`,
        );
        return null;
      }

      const data = (await response.json()) as GladiaResponse;
      return data.url;
    } catch (error) {
      console.error("Error initializing Gladia session:", error);
      return null;
    }
  };

  const setupStream = useCallback(async () => {
    console.log(
      "setupStream called, isMicrophoneEnabled:",
      isMicrophoneEnabled,
    );
    if (!isMicrophoneEnabled) {
      console.log("Microphone is disabled in setupStream, returning early");
      return;
    }

    try {
      console.log("Setting up audio stream...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16,
        },
        video: false,
      });
      const audioTrack = stream.getAudioTracks()[0];
      console.log("Got audio stream:", audioTrack?.label ?? "unknown track");

      // Initialize Gladia session and get WebSocket URL
      const wsUrl = await initGladiaSession();
      if (!wsUrl) {
        console.error("Failed to initialize Gladia session");
        return;
      }

      console.log("Connecting to Gladia WebSocket...");
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("Connected to Gladia WebSocket");
        // Send initial configuration message
        socket.send(
          JSON.stringify({
            type: "start",
            sampling_rate: 16000,
            encoding: "wav/pcm",
            language: "en",
          }),
        );
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      socket.onclose = (event) => {
        console.log("WebSocket closed:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as TranscriptionData;
          console.log("Received Gladia message:", data);

          switch (data.type) {
            case "transcript":
              const transcriptText = data.data?.utterance?.text;
              if (transcriptText && !data.error) {
                console.log("Adding new transcription:", transcriptText);
                setTranscriptions((prev) => [...prev, transcriptText]);
              }
              break;
            case "error":
              console.error("Gladia transcription error:", data.error);
              break;
            case "audio_chunk":
              console.log("Audio chunk acknowledged");
              break;
            default:
              console.log("Unhandled message type:", data.type);
          }
        } catch (error) {
          console.error("Error processing message from Gladia:", error);
        }
      };

      // Create AudioContext with specific sample rate
      const context = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
      });
      console.log("Created AudioContext, state:", context.state);
      setAudioContext(context);

      // Resume AudioContext
      if (context.state === "suspended") {
        await context.resume();
        console.log("AudioContext resumed, new state:", context.state);
      }

      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(2048, 1, 1);
      console.log("Created audio processor");

      processor.onaudioprocess = (event) => {
        if (socket.readyState === WebSocket.OPEN) {
          try {
            const inputData = event.inputBuffer.getChannelData(0);
            const pcmData = new Int16Array(inputData.length);

            // Convert Float32 to Int16 with proper scaling
            for (let i = 0; i < inputData.length; i++) {
              // Clamp the value between -1 and 1
              const float = Math.max(-1, Math.min(1, inputData[i] ?? 0));
              // Convert to 16-bit integer
              pcmData[i] = Math.round(float * 32767);
            }

            // Convert to base64
            const buffer = pcmData.buffer;
            const base64Data = btoa(
              String.fromCharCode(...new Uint8Array(buffer)),
            );

            const message = {
              type: "audio_chunk",
              data: {
                chunk: base64Data,
              },
            };
            socket.send(JSON.stringify(message));
          } catch (error) {
            console.error("Error processing audio data:", error);
          }
        }
      };

      source.connect(processor);
      processor.connect(context.destination);
      console.log("Audio processing chain connected");
      setWs(socket);

      return () => {
        console.log("Cleaning up audio stream...");
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "stop" }));
          socket.close(1000);
        }
        stream.getTracks().forEach((track) => {
          console.log("Stopping track:", track.label);
          track.stop();
        });
        source.disconnect();
        processor.disconnect();
        void context.close();
      };
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }, [isMicrophoneEnabled]);

  // Effect to handle stream setup
  useEffect(() => {
    console.log(
      "useTranscription effect triggered, isMicrophoneEnabled:",
      isMicrophoneEnabled,
    );
    if (isMicrophoneEnabled) {
      console.log("Microphone is enabled, setting up stream...");
      const cleanupPromise = setupStream();
      return () => {
        console.log("useTranscription cleanup");
        if (cleanupPromise != null) {
          void cleanupPromise.then((cleanupFn) => cleanupFn?.());
        }
      };
    } else {
      console.log("Microphone is disabled, not setting up stream");
    }
  }, [isMicrophoneEnabled, setupStream]);

  return { transcriptions };
}
