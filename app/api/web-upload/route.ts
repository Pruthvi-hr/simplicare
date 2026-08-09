import { analyzeMedicalBillFromImageUrl } from "@/lib/ai";
import { buildSpeechScript } from "@/lib/bill-presentation";
import { textToSpeechAndUpload } from "@/lib/tts";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BILL_UPLOAD_BUCKET = "bill_uploads";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceKey ?? anonKey;

  if (!url || !key) {
    throw new Error("Supabase is not configured.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function extensionForFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  const mime = file.type.toLowerCase();
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

async function uploadBillImage(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength === 0) {
    throw new Error("Uploaded file is empty.");
  }
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 10 MB or smaller.");
  }

  const supabase = getSupabaseAdmin();
  const objectPath = `${randomUUID()}.${extensionForFile(file)}`;

  const { error: uploadError } = await supabase.storage
    .from(BILL_UPLOAD_BUCKET)
    .upload(objectPath, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to store bill image: ${uploadError.message}`);
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(BILL_UPLOAD_BUCKET)
    .createSignedUrl(objectPath, 60 * 15);

  if (signError || !signed?.signedUrl) {
    throw new Error("Could not create a secure link for bill analysis.");
  }

  return signed.signedUrl;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "Please choose a bill image to upload." },
        { status: 400 },
      );
    }

    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are supported." },
        { status: 400 },
      );
    }

    const imageUrl = await uploadBillImage(image);
    const analysis = await analyzeMedicalBillFromImageUrl(imageUrl);
    const audioUrl = await textToSpeechAndUpload(buildSpeechScript(analysis));

    return NextResponse.json({ analysis, audioUrl });
  } catch (error) {
    console.error("[web-upload] Failed to process bill:", error);
    const message =
      error instanceof Error
        ? error.message
        : "We could not process your bill. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
