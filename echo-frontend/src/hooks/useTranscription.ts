import { useEffect, useState, useCallback } from "react";
import { useLocalParticipant } from "@livekit/components-react";

interface TranscriptionData {
  type: string;
  text: string;
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
        audio: true,
        video: false,
      });
      const audioTrack = stream.getAudioTracks()[0];
      console.log("Got audio stream:", audioTrack?.label ?? "unknown track");

      const apiKey = process.env.NEXT_PUBLIC_GLADIA_API_KEY;
      if (!apiKey) {
        console.error("Gladia API key is missing");
        return;
      }
      console.log("API key found, length:", apiKey.length);

      console.log("Connecting to Gladia...");
      const socket = new WebSocket(
        "wss://api.gladia.io/audio/text/audio-transcription",
      );

      socket.onopen = () => {
        console.log("Connected to Gladia WebSocket");
        try {
          const initMessage = {
            api_key: apiKey,
            model: "general",
            sample_rate: 16000,
          };
          console.log("Sending init message to Gladia:", initMessage);
          socket.send(JSON.stringify(initMessage));
        } catch (error) {
          console.error("Error sending initial message to Gladia:", error);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        console.log("WebSocket state:", {
          readyState: socket.readyState,
          url: socket.url,
          protocol: socket.protocol,
          extensions: socket.extensions,
        });
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
          console.log("Received message from Gladia:", event.data);
          const data = JSON.parse(event.data as string) as TranscriptionData;
          if (data.type === "transcription") {
            console.log("Received transcription:", data.text);
            setTranscriptions((prev) => [...prev, data.text]);
          } else {
            console.log("Received non-transcription message:", data);
          }
        } catch (error) {
          console.error("Error processing message from Gladia:", error);
        }
      };

      // Create AudioContext only after user interaction
      const context = new AudioContext();
      console.log("Created AudioContext, state:", context.state);
      setAudioContext(context);

      // Resume AudioContext
      if (context.state === "suspended") {
        console.log("Resuming AudioContext...");
        await context.resume();
        console.log("AudioContext resumed, new state:", context.state);
      }

      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(1024, 1, 1);
      console.log("Created audio processor");

      let audioDataSent = false;
      processor.onaudioprocess = (event) => {
        if (socket.readyState === WebSocket.OPEN) {
          try {
            const audioData = event.inputBuffer.getChannelData(0);
            if (!audioDataSent) {
              console.log(
                "Sending first audio data chunk, length:",
                audioData.length,
              );
              audioDataSent = true;
            }
            // Convert Float32Array to Int16Array for Gladia
            const pcmData = new Int16Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
              const value = audioData[i] ?? 0;
              pcmData[i] = Math.max(
                -32768,
                Math.min(32767, Math.round(value * 32768)),
              );
            }
            // Create a Blob with the correct audio format
            const blob = new Blob([pcmData], { type: "audio/raw" });
            socket.send(blob);
          } catch (error) {
            console.error("Error sending audio data:", error);
          }
        }
      };

      source.connect(processor);
      processor.connect(context.destination);
      console.log("Audio processing chain connected");
      setWs(socket);

      return () => {
        console.log("Cleaning up audio stream...");
        stream.getTracks().forEach((track) => {
          console.log("Stopping track:", track.label);
          track.stop();
        });
        if (socket.readyState === WebSocket.OPEN) {
          console.log("Closing WebSocket connection");
          socket.close();
        }
        if (context) {
          console.log("Closing AudioContext");
          void context.close();
        }
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
      const cleanup = setupStream();
      return () => {
        console.log("useTranscription cleanup");
        void cleanup?.then((cleanupFn) => cleanupFn?.());
      };
    } else {
      console.log("Microphone is disabled, not setting up stream");
    }
  }, [isMicrophoneEnabled, setupStream]);

  return { transcriptions };
}
