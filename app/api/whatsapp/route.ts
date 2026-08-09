import { analyzeMedicalBillFromImageUrl } from "@/lib/ai";
import {
  buildSpeechScript,
  formatBillSummaryMessage,
} from "@/lib/bill-presentation";
import { textToSpeechAndUpload } from "@/lib/tts";
import twilio from "twilio";

export const runtime = "nodejs";

const TWIML_CONTENT_TYPE = "text/xml; charset=utf-8";

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error(
      "Twilio is not configured (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required).",
    );
  }

  return twilio(accountSid, authToken);
}

function twimlResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": TWIML_CONTENT_TYPE },
  });
}

function emptyTwimlResponse(): Response {
  const messagingResponse = new twilio.twiml.MessagingResponse();
  return twimlResponse(messagingResponse.toString());
}

async function parseFormBody(request: Request): Promise<URLSearchParams> {
  const rawBody = await request.text();
  return new URLSearchParams(rawBody);
}

export async function POST(request: Request) {
  try {
    const params = await parseFormBody(request);
    const mediaUrl = params.get("MediaUrl0")?.trim();
    const userWhatsApp = params.get("From")?.trim();
    const twilioWhatsApp = params.get("To")?.trim();

    if (!mediaUrl) {
      const messagingResponse = new twilio.twiml.MessagingResponse();
      messagingResponse.message(
        "Hi! Please send a clear photo of your medical bill so we can summarize it for you.",
      );
      return twimlResponse(messagingResponse.toString());
    }

    if (!userWhatsApp || !twilioWhatsApp) {
      console.error("[whatsapp webhook] Missing From or To on inbound message.");
      return emptyTwimlResponse();
    }

    const analysis = await analyzeMedicalBillFromImageUrl(mediaUrl);
    const textBody = formatBillSummaryMessage(analysis);
    const audioUrl = await textToSpeechAndUpload(buildSpeechScript(analysis));

    const client = getTwilioClient();

    const outboundMessages: Promise<unknown>[] = [
      client.messages.create({
        from: twilioWhatsApp,
        to: userWhatsApp,
        body: textBody,
      }),
    ];

    if (audioUrl) {
      outboundMessages.push(
        client.messages.create({
          from: twilioWhatsApp,
          to: userWhatsApp,
          mediaUrl: [audioUrl],
        }),
      );
    } else {
      console.warn(
        "[whatsapp webhook] TTS upload failed; sending text summary only.",
        { userWhatsApp },
      );
    }

    await Promise.all(outboundMessages);

    return emptyTwimlResponse();
  } catch (error) {
    console.error("[whatsapp webhook] Unhandled error:", error);

    const messagingResponse = new twilio.twiml.MessagingResponse();
    messagingResponse.message(
      "Sorry, we could not process your bill right now. Please try sending the photo again in a moment.",
    );
    return twimlResponse(messagingResponse.toString());
  }
}
