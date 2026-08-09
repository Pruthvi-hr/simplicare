"use client";

import type { MedicalBillAnalysis } from "@/lib/ai";
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  FileText,
  HeartHandshake,
  Loader2,
  Sparkles,
  Upload,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";

type UploadResult = {
  analysis: MedicalBillAnalysis;
  audioUrl: string | null;
};

const LOADING_MESSAGES = [
  "Translating medical jargon into plain language…",
  "Reading your bill with care…",
  "Finding the amount due and due date…",
  "Preparing a gentle summary you can trust…",
  "Almost ready — thank you for your patience…",
] as const;

function LoadingPanel({ message }: { message: string }) {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="rounded-3xl border-2 border-[#0f2d52] bg-white p-6 shadow-lg sm:p-8"
    >
      <div className="flex items-start gap-4">
        <Loader2
          aria-hidden
          className="mt-1 size-10 shrink-0 animate-spin text-[#0b5cab]"
        />
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-semibold leading-snug text-[#0f172a] sm:text-3xl">
            {message}
          </p>
          <p className="mt-3 text-xl leading-relaxed text-[#334155]">
            This usually takes a short moment. You can stay on this page — we
            will show your results here.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-4" aria-hidden>
        <div className="h-6 animate-pulse rounded-2xl bg-[#dbeafe]" />
        <div className="h-6 w-11/12 animate-pulse rounded-2xl bg-[#dbeafe]" />
        <div className="h-24 animate-pulse rounded-3xl bg-[#eff6ff]" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-20 animate-pulse rounded-3xl bg-[#eff6ff]" />
          <div className="h-20 animate-pulse rounded-3xl bg-[#eff6ff]" />
        </div>
      </div>
    </section>
  );
}

function ResultPanel({ result }: { result: UploadResult }) {
  const { analysis, audioUrl } = result;

  return (
    <section
      aria-live="polite"
      className="space-y-6"
      aria-label="Your bill summary"
    >
      <article className="rounded-3xl border-2 border-[#0f2d52] bg-white p-6 shadow-lg sm:p-8">
        <div className="flex items-center gap-3">
          <Sparkles aria-hidden className="size-9 text-[#0b5cab]" />
          <h2 className="text-3xl font-bold text-[#0f172a] sm:text-4xl">
            Your simple summary
          </h2>
        </div>
        <p className="mt-5 text-2xl leading-relaxed text-[#1e293b] sm:text-[1.65rem] sm:leading-relaxed">
          {analysis.simplifiedSummary}
        </p>
      </article>

      <div className="grid gap-6 sm:grid-cols-2">
        <article className="rounded-3xl border-2 border-[#0f2d52] bg-[#f0f9ff] p-6 shadow-md">
          <div className="flex items-center gap-3">
            <CircleDollarSign aria-hidden className="size-9 text-[#0b5cab]" />
            <h3 className="text-2xl font-bold text-[#0f172a] sm:text-3xl">
              Amount due
            </h3>
          </div>
          <p className="mt-4 text-3xl font-semibold text-[#0f172a] sm:text-4xl">
            {analysis.amountDue}
          </p>
        </article>

        <article className="rounded-3xl border-2 border-[#0f2d52] bg-[#f0f9ff] p-6 shadow-md">
          <div className="flex items-center gap-3">
            <CalendarDays aria-hidden className="size-9 text-[#0b5cab]" />
            <h3 className="text-2xl font-bold text-[#0f172a] sm:text-3xl">
              Due date
            </h3>
          </div>
          <p className="mt-4 text-3xl font-semibold text-[#0f172a] sm:text-4xl">
            {analysis.dueDate}
          </p>
        </article>
      </div>

      <article className="rounded-3xl border-2 border-[#0f2d52] bg-white p-6 shadow-lg sm:p-8">
        <div className="flex items-center gap-3">
          <HeartHandshake aria-hidden className="size-9 text-[#0b5cab]" />
          <h3 className="text-2xl font-bold text-[#0f172a] sm:text-3xl">
            Your next step
          </h3>
        </div>
        <p className="mt-4 flex items-start gap-3 text-2xl leading-relaxed text-[#1e293b] sm:text-[1.65rem]">
          <ArrowRight
            aria-hidden
            className="mt-1 size-8 shrink-0 text-[#0b5cab]"
          />
          <span>{analysis.nextSteps}</span>
        </p>
      </article>

      {audioUrl ? (
        <article className="rounded-3xl border-2 border-[#0f2d52] bg-[#ecfeff] p-6 shadow-lg sm:p-8">
          <div className="flex items-center gap-3">
            <Volume2 aria-hidden className="size-10 text-[#0b5cab]" />
            <h3 className="text-2xl font-bold text-[#0f172a] sm:text-3xl">
              Listen to your summary
            </h3>
          </div>
          <p className="mt-3 text-xl leading-relaxed text-[#334155]">
            Press play to hear the same information read aloud in a calm voice.
          </p>
          <audio
            controls
            preload="metadata"
            src={audioUrl}
            className="mt-6 w-full min-h-14 accent-[#0b5cab]"
            aria-label="Audio summary of your medical bill"
          >
            Your browser does not support audio playback. You can still read the
            summary above.
          </audio>
        </article>
      ) : (
        <p
          role="status"
          className="rounded-3xl border-2 border-amber-700 bg-amber-50 p-5 text-xl text-amber-950"
        >
          We could not generate audio right now, but your written summary is
          ready below.
        </p>
      )}

      <details className="rounded-3xl border-2 border-[#64748b] bg-white p-6 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center gap-3 text-xl font-semibold text-[#0f172a] sm:text-2xl [&::-webkit-details-marker]:hidden">
          <FileText aria-hidden className="size-8 text-[#0b5cab]" />
          View formatted data (JSON)
        </summary>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-[#0f172a] p-5 text-lg leading-relaxed text-[#f8fafc] sm:text-xl">
          {JSON.stringify({ analysis, audioUrl }, null, 2)}
        </pre>
      </details>
    </section>
  );
}

export function BillUploadForm() {
  const inputId = useId();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) return;

    const interval = window.setInterval(() => {
      setLoadingMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setResult(null);

      const form = event.currentTarget;
      const fileInput = form.elements.namedItem("image") as HTMLInputElement;
      const file = fileInput.files?.[0];

      if (!file) {
        setError("Please choose a photo of your bill before continuing.");
        return;
      }

      setSelectedName(file.name);
      setIsLoading(true);
      setLoadingMessageIndex(0);

      const body = new FormData();
      body.append("image", file);

      try {
        const response = await fetch("/api/web-upload", {
          method: "POST",
          body,
        });

        const payload = (await response.json()) as UploadResult & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Something went wrong. Please try again.");
        }

        setResult({
          analysis: payload.analysis,
          audioUrl: payload.audioUrl,
        });
      } catch (uploadError) {
        const message =
          uploadError instanceof Error
            ? uploadError.message
            : "We could not upload your bill. Please try again.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border-2 border-[#0f2d52] bg-white p-6 shadow-lg sm:p-8"
        aria-describedby={`${inputId}-help`}
      >
        <label
          htmlFor={inputId}
          className="flex cursor-pointer flex-col items-center gap-5 rounded-3xl border-2 border-dashed border-[#0b5cab] bg-[#f8fbff] px-6 py-10 text-center transition hover:bg-[#eff6ff] focus-within:ring-4 focus-within:ring-[#0b5cab]/40"
        >
          <Upload aria-hidden className="size-14 text-[#0b5cab]" strokeWidth={2.25} />
          <span className="text-2xl font-bold text-[#0f172a] sm:text-3xl">
            Tap to upload your bill photo
          </span>
          <span className="text-xl leading-relaxed text-[#475569]">
            JPG or PNG works best. Good lighting helps us read the details.
          </span>
          <input
            id={inputId}
            name="image"
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setSelectedName(file?.name ?? null);
              setError(null);
            }}
          />
        </label>

        <p id={`${inputId}-help`} className="mt-5 text-xl text-[#475569]">
          {selectedName
            ? `Selected file: ${selectedName}`
            : "No file selected yet."}
        </p>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#0b5cab] px-6 text-2xl font-bold text-white shadow-md transition hover:bg-[#094d91] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#0b5cab] disabled:cursor-not-allowed disabled:opacity-60 sm:text-3xl"
        >
          {isLoading ? (
            <>
              <Loader2 aria-hidden className="size-8 animate-spin" />
              Working on your summary…
            </>
          ) : (
            <>
              <Sparkles aria-hidden className="size-8" />
              Explain my bill
            </>
          )}
        </button>
      </form>

      {error ? (
        <p
          role="alert"
          className="rounded-3xl border-2 border-red-800 bg-red-50 p-5 text-xl font-medium text-red-950 sm:text-2xl"
        >
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <LoadingPanel message={LOADING_MESSAGES[loadingMessageIndex]} />
      ) : null}

      {!isLoading && result ? <ResultPanel result={result} /> : null}
    </div>
  );
}
