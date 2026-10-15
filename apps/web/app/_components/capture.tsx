"use client";

import type { BillDraft } from "@repo/core";
import { useRef, useState } from "react";
import { ParseRequestError, requestParse } from "../../lib/api";
import { BillCard } from "./bill-card";
import { applyParse, emptyBillForm, toBill, type BillForm } from "../_lib/bill-form";
import styles from "./capture.module.css";
import { SavedBills } from "./saved-bills";
import { useSavedBills } from "../_lib/saved-bills-store";
import { useSpeechCapture } from "../_lib/use-speech-capture";

const EXAMPLE = "“Council tax, £140, on the 1st, every month”";

export function Capture() {
  const { add } = useSavedBills();
  const [form, setForm] = useState<BillForm | null>(null);
  const [spokenSoFar, setSpokenSoFar] = useState("");
  const [lastParsed, setLastParsed] = useState<BillDraft>({});
  const [parsing, setParsing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const latestRequest = useRef(0);

  async function handleText(text: string) {
    const requestId = ++latestRequest.current;
    const isLatest = () => requestId === latestRequest.current;
    const combined = form ? `${spokenSoFar}. ${text}` : text;
    setParsing(true);
    setMessage(null);
    try {
      const result = await requestParse(combined);
      if (!isLatest()) return;
      if (result.status === "not-a-bill") {
        setMessage(
          `That didn't sound like a bill. Try something like ${EXAMPLE}.`,
        );
        return;
      }
      const draft = result.status === "complete" ? result.bill : result.draft;
      setForm((current) =>
        applyParse(current ?? emptyBillForm, lastParsed, draft),
      );
      setLastParsed(draft);
      setSpokenSoFar(combined);
      setTyped("");
    } catch (error) {
      if (!isLatest()) return;
      setMessage(
        error instanceof ParseRequestError
          ? error.message
          : "Something went wrong. Try again in a moment.",
      );
    } finally {
      if (isLatest()) setParsing(false);
    }
  }

  const speech = useSpeechCapture((transcript) => void handleText(transcript));
  const micBlocked = speech.error === "not-allowed";
  const showTyping = typing || speech.supported === false || micBlocked;

  function reset() {
    latestRequest.current++;
    setParsing(false);
    setForm(null);
    setSpokenSoFar("");
    setLastParsed({});
  }

  function save() {
    const bill = form && toBill(form);
    if (!bill) return;
    add(bill);
    reset();
    setMessage(`Saved ${bill.name}.`);
  }

  let status: string;
  if (speech.listening) status = speech.transcript || "Listening…";
  else if (parsing) status = "Sorting it…";
  else if (form) status = "Tap the mic to add or change something.";
  else status = "Tap to talk, or hold while you speak.";

  let notice = message;
  if (micBlocked) {
    notice =
      "Microphone access is blocked. Allow it in your browser settings, or type it instead.";
  } else if (speech.error === "failed") {
    notice = "Couldn't hear that. Try again, or type it instead.";
  } else if (speech.supported === false) {
    notice = "Voice isn't supported in this browser, so type it instead.";
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>What&apos;s the bill?</h1>
      <p className={styles.example}>Like {EXAMPLE}</p>

      {!showTyping && (
        <button
          type="button"
          className={styles.mic}
          data-listening={speech.listening}
          disabled={parsing}
          aria-pressed={speech.listening}
          aria-label={speech.listening ? "Stop listening" : "Start speaking"}
          {...speech.buttonProps}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
        </button>
      )}

      {showTyping && (
        <form
          className={styles.typeForm}
          onSubmit={(event) => {
            event.preventDefault();
            if (typed.trim()) void handleText(typed.trim());
          }}
        >
          <input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder="Council tax, £140, on the 1st, monthly"
            aria-label="Describe the bill"
            enterKeyHint="send"
            maxLength={500}
            autoFocus={typing}
          />
          <button type="submit" className={styles.primary} disabled={parsing}>
            Sort it
          </button>
        </form>
      )}

      <p className={styles.status} aria-live="polite">
        {status}
      </p>

      {speech.supported && !micBlocked && (
        <button
          type="button"
          className={styles.link}
          onClick={() => setTyping(!typing)}
        >
          {typing ? "Speak instead" : "Type instead"}
        </button>
      )}

      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      {form && (
        <BillCard
          form={form}
          onChange={setForm}
          onSave={save}
          onDiscard={() => {
            reset();
            setMessage(null);
          }}
        />
      )}

      <SavedBills />
    </main>
  );
}
