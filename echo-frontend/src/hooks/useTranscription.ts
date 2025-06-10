import { useEffect, useState, useCallback, useRef } from "react";
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

type TranscriptionStatus = "IDLE" | "STARTING" | "STARTED" | "STOPPING";

export function useTranscription() {
  const { isMicrophoneEnabled } = useLocalParticipant();
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  const instanceIdRef = useRef(Math.random().toString(36).substring(7));
  console.log(
    `[Transcription Hook] Instance ${instanceIdRef.current} created.`,
  );
  const statusRef = useRef<TranscriptionStatus>("IDLE");
  const resourcesRef = useRef<{
    socket?: WebSocket;
    stream?: MediaStream;
    context?: AudioContext;
    source?: MediaStreamAudioSourceNode;
    processor?: AudioWorkletNode;
  }>({});

  const stopTranscription = useCallback(() => {
    if (statusRef.current === "IDLE" || statusRef.current === "STOPPING")
      return;

    console.log("Stopping transcription...");
    statusRef.current = "STOPPING";

    const { socket, stream, context, source, processor } = resourcesRef.current;

    if (socket) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "stop" }));
      }
      socket.close();
    }
    if (source) source.disconnect();
    if (processor) processor.disconnect();
    if (context && context.state !== "closed") void context.close();
    if (stream) stream.getTracks().forEach((track) => track.stop());

    resourcesRef.current = {};
    statusRef.current = "IDLE";
    console.log("Transcription stopped and resources cleaned up.");
  }, []);

  const startTranscription = useCallback(async () => {
    if (statusRef.current !== "IDLE") {
      console.warn(`Cannot start, current status is: ${statusRef.current}`);
      return;
    }

    console.log("Starting transcription...");
    statusRef.current = "STARTING";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1 },
      });
      resourcesRef.current.stream = stream;

      const context = new (window.AudioContext || window.webkitAudioContext)();
      resourcesRef.current.context = context;
      if (context.state === "suspended") await context.resume();

      const response = await fetch("/api/gladia", { method: "POST" });
      if (!response.ok) throw new Error(await response.text());
      const gladiaData = (await response.json()) as GladiaResponse;
      const wsUrl = gladiaData.url.replace("ws://", "wss://");

      const socket = new WebSocket(wsUrl);
      resourcesRef.current.socket = socket;

      socket.onopen = () => {
        console.log("Gladia WebSocket connected.");
        socket.send(
          JSON.stringify({
            type: "start",
            sampling_rate: 16000,
            language: "en",
          }),
        );
      };

      socket.onmessage = (event: MessageEvent<string>) => {
        const data = JSON.parse(event.data) as TranscriptionData;
        const text = data.data?.utterance?.text;
        if (data.type === "transcript" && text) {
          setTranscriptions((prev) => [...prev, text]);
        }
      };
      socket.onerror = (e) => console.error("Gladia WebSocket error:", e);
      socket.onclose = () => console.log("Gladia WebSocket closed.");

      await context.audioWorklet.addModule("/audio-worklet-processor.js");
      const processor = new AudioWorkletNode(context, "resampling-processor", {
        processorOptions: {
          targetSampleRate: 16000,
        },
      });
      resourcesRef.current.processor = processor;

      processor.port.onmessage = (event: MessageEvent<Float32Array>) => {
        if (socket.readyState !== WebSocket.OPEN) return;
        const pcmData = new Int16Array(event.data.length);
        for (let i = 0; i < event.data.length; i++) {
          const sample = event.data[i] ?? 0;
          pcmData[i] = Math.round(Math.max(-1, Math.min(1, sample)) * 32767);
        }
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(pcmData.buffer)),
        );
        socket.send(
          JSON.stringify({ type: "audio_chunk", data: { chunk: base64 } }),
        );
      };

      const source = context.createMediaStreamSource(stream);
      resourcesRef.current.source = source;
      source.connect(processor).connect(context.destination);

      statusRef.current = "STARTED";
      console.log("Transcription started successfully.");
    } catch (error) {
      console.error("Failed to start transcription:", error);
      stopTranscription();
    }
  }, [stopTranscription]);

  useEffect(() => {
    if (isMicrophoneEnabled) {
      void startTranscription();
    } else {
      stopTranscription();
    }
    // This cleanup runs when the component unmounts or deps change.
    return stopTranscription;
  }, [isMicrophoneEnabled, startTranscription, stopTranscription]);

  return { transcriptions };
}
