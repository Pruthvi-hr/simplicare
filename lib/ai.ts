import { GoogleGenAI, Type } from "@google/genai";
import axios from "axios";

export interface MedicalBillAnalysis {
  simplifiedSummary: string;
  amountDue: string;
  dueDate: string;
  nextSteps: string;
}

const GEMINI_MODEL = "gemini-1.5-flash";

const ANALYSIS_PROMPT =
  "Extract text from this medical bill. Summarize it at a 5th-grade reading level. Extract Total Amount Due, Due Date, and an empathetic Next Step.";

const MEDICAL_BILL_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    simplifiedSummary: {
      type: Type.STRING,
      description:
        "Plain-language summary of the bill at a 5th-grade reading level.",
    },
    amountDue: {
      type: Type.STRING,
      description: "Total amount due exactly as shown on the bill.",
    },
    dueDate: {
      type: Type.STRING,
      description: "Payment due date exactly as shown on the bill.",
    },
    nextSteps: {
      type: Type.STRING,
      description: "One clear, empathetic next step for the patient.",
    },
  },
  required: ["simplifiedSummary", "amountDue", "dueDate", "nextSteps"],
} as const;

export const MEDICAL_BILL_ANALYSIS_FALLBACK: MedicalBillAnalysis = {
  simplifiedSummary:
    "We could not read this bill right now. Please try again in a moment or contact your provider's billing office for help.",
  amountDue: "Unknown",
  dueDate: "Unknown",
  nextSteps:
    "When you are ready, call the phone number on your bill and ask about your balance—you do not have to figure this out alone.",
};

const IMAGE_DOWNLOAD_TIMEOUT_MS = 30_000;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

function inferMimeType(
  contentType: string | undefined,
  imageUrl: string,
): string {
  const normalized = contentType?.split(";")[0]?.trim().toLowerCase();
  if (normalized?.startsWith("image/")) {
    return normalized;
  }

  const pathname = new URL(imageUrl).pathname.toLowerCase();
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".gif")) return "image/gif";
  if (pathname.endsWith(".bmp")) return "image/bmp";
  if (pathname.endsWith(".heic")) return "image/heic";
  if (pathname.endsWith(".heif")) return "image/heif";
  return "image/jpeg";
}

function isMedicalBillAnalysis(value: unknown): value is MedicalBillAnalysis {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.simplifiedSummary === "string" &&
    typeof record.amountDue === "string" &&
    typeof record.dueDate === "string" &&
    typeof record.nextSteps === "string"
  );
}

function parseMedicalBillAnalysis(raw: string): MedicalBillAnalysis {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error("Gemini response was not valid JSON.", { cause: error });
  }

  if (!isMedicalBillAnalysis(parsed)) {
    throw new Error(
      "Gemini JSON response did not match the expected MedicalBillAnalysis shape.",
    );
  }

  return parsed;
}

async function downloadImageAsBase64(
  imageUrl: string,
): Promise<{ data: string; mimeType: string }> {
  const response = await axios.get<ArrayBuffer>(imageUrl, {
    responseType: "arraybuffer",
    timeout: IMAGE_DOWNLOAD_TIMEOUT_MS,
    maxContentLength: MAX_IMAGE_BYTES,
    maxBodyLength: MAX_IMAGE_BYTES,
    validateStatus: (status) => status >= 200 && status < 300,
  });

  const buffer = Buffer.from(response.data);
  if (buffer.byteLength === 0) {
    throw new Error("Downloaded image is empty.");
  }

  const mimeType = inferMimeType(
    typeof response.headers["content-type"] === "string"
      ? response.headers["content-type"]
      : undefined,
    imageUrl,
  );

  return { data: buffer.toString("base64"), mimeType };
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({ apiKey });
}

function logAnalysisError(imageUrl: string, error: unknown): void {
  if (axios.isAxiosError(error)) {
    console.error("[analyzeMedicalBillFromImageUrl] Image download failed:", {
      imageUrl,
      code: error.code,
      status: error.response?.status,
      message: error.message,
    });
    return;
  }

  if (error instanceof Error) {
    console.error("[analyzeMedicalBillFromImageUrl] Analysis failed:", {
      imageUrl,
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return;
  }

  console.error("[analyzeMedicalBillFromImageUrl] Unknown error:", {
    imageUrl,
    error,
  });
}

/**
 * Downloads a medical bill image and returns a structured, patient-friendly summary via Gemini.
 */
export async function analyzeMedicalBillFromImageUrl(
  imageUrl: string,
): Promise<MedicalBillAnalysis> {
  try {
    const trimmedUrl = imageUrl?.trim();
    if (!trimmedUrl) {
      throw new Error("Image URL is required.");
    }

    const { data, mimeType } = await downloadImageAsBase64(trimmedUrl);
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: ANALYSIS_PROMPT },
            { inlineData: { mimeType, data } },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: MEDICAL_BILL_RESPONSE_SCHEMA,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    return parseMedicalBillAnalysis(text);
  } catch (error) {
    logAnalysisError(imageUrl, error);
    return { ...MEDICAL_BILL_ANALYSIS_FALLBACK };
  }
}
