import { createClient, SupabaseClient } from "@supabase/supabase-js";
import axios from "axios";
import { randomUUID } from "crypto";

const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";
/** Sarah — soft, natural premade voice suited to empathetic patient-facing copy. */
const DEFAULT_ELEVENLABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
const ELEVENLABS_MODEL_ID = "eleven_turbo_v2_5";
const SUPABASE_AUDIO_BUCKET = "audio_files";
const TTS_REQUEST_TIMEOUT_MS = 60_000;

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceKey ?? anonKey;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL and a Supabase key are required).",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function resolveVoiceId(): string {
  return process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_ELEVENLABS_VOICE_ID;
}

async function fetchSpeechAudio(text: string): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured.");
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Text for speech synthesis cannot be empty.");
  }

  const voiceId = resolveVoiceId();
  const response = await axios.post<ArrayBuffer>(
    `${ELEVENLABS_TTS_URL}/${voiceId}`,
    {
      text: trimmed,
      model_id: ELEVENLABS_MODEL_ID,
    },
    {
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      responseType: "arraybuffer",
      timeout: TTS_REQUEST_TIMEOUT_MS,
      validateStatus: (status) => status >= 200 && status < 300,
    },
  );

  if (!response.data || response.data.byteLength === 0) {
    throw new Error("ElevenLabs returned empty audio.");
  }

  return response.data;
}

async function uploadAudioToSupabase(audio: ArrayBuffer): Promise<string> {
  const supabase = getSupabaseAdmin();
  const objectPath = `${randomUUID()}.mp3`;

  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_AUDIO_BUCKET)
    .upload(objectPath, Buffer.from(audio), {
      contentType: "audio/mpeg",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Supabase upload failed: ${uploadError.message}`, {
      cause: uploadError,
    });
  }

  const { data } = supabase.storage
    .from(SUPABASE_AUDIO_BUCKET)
    .getPublicUrl(objectPath);

  if (!data.publicUrl) {
    throw new Error("Supabase did not return a public URL for uploaded audio.");
  }

  return data.publicUrl;
}

function logTtsError(text: string, error: unknown): void {
  const preview =
    text.length > 120 ? `${text.slice(0, 117).trimEnd()}...` : text;

  if (axios.isAxiosError(error)) {
    const errorBody =
      error.response?.data instanceof ArrayBuffer
        ? Buffer.from(error.response.data).toString("utf8").slice(0, 500)
        : error.response?.data;

    console.error("[textToSpeechAndUpload] ElevenLabs request failed:", {
      status: error.response?.status,
      code: error.code,
      message: error.message,
      body: errorBody,
      textPreview: preview,
    });
    return;
  }

  if (error instanceof Error) {
    console.error("[textToSpeechAndUpload] Failed:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      textPreview: preview,
    });
    return;
  }

  console.error("[textToSpeechAndUpload] Unknown error:", {
    error,
    textPreview: preview,
  });
}

/**
 * Synthesizes speech with ElevenLabs, stores MP3 in Supabase `audio_files`, and returns the public URL.
 */
export async function textToSpeechAndUpload(text: string): Promise<string | null> {
  try {
    const audio = await fetchSpeechAudio(text);
    return await uploadAudioToSupabase(audio);
  } catch (error) {
    logTtsError(text, error);
    return null;
  }
}
