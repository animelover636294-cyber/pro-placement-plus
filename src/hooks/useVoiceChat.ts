import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { synthesizeSpeech, transcribeAudio } from "@/lib/voice";

/**
 * Shared speech-to-text (microphone dictation) and text-to-speech (read aloud)
 * behaviour for every assistant surface.
 */
export function useVoiceChat(accessToken?: string | null) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording || isTranscribing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      toast.error("Microphone access is required for voice input.");
    }
  }, [isRecording, isTranscribing]);

  /** Stops recording and resolves with the transcript ("" when nothing was heard). */
  const stopRecording = useCallback(async (): Promise<string> => {
    const recorder = recorderRef.current;
    if (!recorder) return "";
    setIsRecording(false);
    setIsTranscribing(true);

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
      recorder.stop();
    });
    recorder.stream.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;

    try {
      const text = await transcribeAudio(blob, accessToken);
      if (!text) toast.info("Didn't catch that — please try again.");
      return text;
    } catch (err) {
      toast.error((err as Error).message);
      return "";
    } finally {
      setIsTranscribing(false);
    }
  }, [accessToken]);

  const stopSpeaking = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
    setSpeakingId(null);
  }, []);

  /** Reads text aloud. Calling again with the same id stops playback. */
  const speak = useCallback(async (id: string, text: string) => {
    if (speakingId === id) { stopSpeaking(); return; }
    stopSpeaking();
    if (!text.trim()) return;
    setSpeakingId(id);
    try {
      const url = await synthesizeSpeech(text, accessToken);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => stopSpeaking();
      await audio.play();
    } catch (err) {
      toast.error((err as Error).message);
      setSpeakingId(null);
    }
  }, [accessToken, speakingId, stopSpeaking]);

  return { isRecording, isTranscribing, speakingId, startRecording, stopRecording, speak, stopSpeaking };
}
