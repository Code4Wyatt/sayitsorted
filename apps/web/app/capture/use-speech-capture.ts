"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type PointerEvent,
} from "react";

const HOLD_THRESHOLD_MS = 300;
const SILENCE_TIMEOUT_MS = 4000;

export type SpeechError = "not-allowed" | "failed";

function getRecognitionClass() {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

const subscribeToNothing = () => () => {};

export function useSpeechCapture(onFinish: (transcript: string) => void) {
  const supported = useSyncExternalStore(
    subscribeToNothing,
    () => getRecognitionClass() !== undefined,
    () => null,
  );
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<SpeechError | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef("");
  const silenceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pressStartedAt = useRef<number | null>(null);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(
    () => () => {
      clearTimeout(silenceTimer.current);
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onend = null;
        recognition.abort();
      }
    },
    [],
  );

  function restartSilenceTimer() {
    clearTimeout(silenceTimer.current);
    silenceTimer.current = setTimeout(
      () => recognitionRef.current?.stop(),
      SILENCE_TIMEOUT_MS,
    );
  }

  function start() {
    const Recognition = getRecognitionClass();
    if (!Recognition || recognitionRef.current) return;

    const recognition = new Recognition();
    recognition.lang = "en-GB";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      transcriptRef.current = Array.from(
        event.results,
        (result) => result[0]?.transcript ?? "",
      )
        .join(" ")
        .replace(/\s+/g, " ");
      setTranscript(transcriptRef.current);
      restartSilenceTimer();
    };

    recognition.onerror = (event) => {
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setError("not-allowed");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        setError("failed");
      }
    };

    recognition.onend = () => {
      clearTimeout(silenceTimer.current);
      recognitionRef.current = null;
      setListening(false);
      const text = transcriptRef.current.trim();
      if (text) onFinishRef.current(text);
    };

    transcriptRef.current = "";
    setTranscript("");
    try {
      recognition.start();
    } catch {
      setError("failed");
      return;
    }
    setError(null);
    recognitionRef.current = recognition;
    setListening(true);
    restartSilenceTimer();
  }

  function stop() {
    recognitionRef.current?.stop();
  }

  const buttonProps = {
    onPointerDown(event: PointerEvent<HTMLButtonElement>) {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      if (recognitionRef.current) {
        pressStartedAt.current = null;
        stop();
      } else {
        pressStartedAt.current = Date.now();
        start();
      }
    },
    onPointerUp() {
      const startedAt = pressStartedAt.current;
      pressStartedAt.current = null;
      if (startedAt !== null && Date.now() - startedAt >= HOLD_THRESHOLD_MS) {
        stop();
      }
    },
    onPointerCancel() {
      pressStartedAt.current = null;
    },
    // Pointer presses are handled above; a click with detail 0 came from the
    // keyboard (Enter or Space).
    onClick(event: MouseEvent<HTMLButtonElement>) {
      if (event.detail !== 0) return;
      if (recognitionRef.current) stop();
      else start();
    },
  };

  return { supported, listening, transcript, error, buttonProps };
}
