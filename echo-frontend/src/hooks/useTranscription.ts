import { useEffect, useState } from "react";
import { useLocalParticipant } from "@livekit/components-react";

interface TranscriptionData {
  type: string;
  text: string;
}

export function useTranscription() {
  const { isMicrophoneEnabled } = useLocalParticipant();
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!isMicrophoneEnabled) return;

    const setupStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });

        const socket = new WebSocket(
          "ws://api.gladia.io/audio/text/audio-trancription",
        );

        socket.onopen = () => {
          console.log("connected to gladia");
          socket.send(
            JSON.stringify({
              api_key: process.env.GLADIA_API_KEY,
              model: "general",
              sample_rate: 16000,
            }),
          );
        };

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data as string) as TranscriptionData;
          if (data.type === "transcription") {
            setTranscriptions((prev) => [...prev, data.text]);
          }
        };

        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(1024, 1, 1);

        processor.onaudioprocess = (event) => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(event.inputBuffer.getChannelData(0));
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        setWs(socket);

        return () => {
          stream.getTracks().forEach((track) => track.stop());
          socket.close();
          void audioContext.close();
        };
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    };

    void setupStream();
  }, [isMicrophoneEnabled]);

  return { transcriptions };
}
