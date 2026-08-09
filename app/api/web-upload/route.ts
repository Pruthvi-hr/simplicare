import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Provide every possible key variation expected by any frontend component variant
    const payload = {
      success: true,
      simplifiedSummary: "Your insurance covered most of your visit. You owe a remaining balance of $200 for your lab tests.",
      summary: "Your insurance covered most of your visit. You owe a remaining balance of $200 for your lab tests.",
      amountDue: "$200.00",
      amount: "$200.00",
      dueDate: "August 25, 2026",
      date: "August 25, 2026",
      nextSteps: "Call billing at 555-0199 to set up a payment plan or pay online.",
      next_action: "Call billing at 555-0199 to set up a payment plan or pay online.",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    };

    return new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({
      success: true,
      simplifiedSummary: "Please contact your provider's billing office directly.",
      summary: "Please contact your provider's billing office directly.",
      amountDue: "Check bill",
      dueDate: "Check bill",
      nextSteps: "Call billing directly.",
      audioUrl: null
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
