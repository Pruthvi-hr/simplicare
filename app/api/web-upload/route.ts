import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    return NextResponse.json({
      simplifiedSummary: "Your insurance covered most of your visit. You owe a remaining balance of $200 for your lab tests.",
      amountDue: "$200.00",
      dueDate: "August 25, 2026",
      nextSteps: "Call billing at 555-0199 to set up a payment plan or pay online.",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    });
  } catch (error: any) {
    return NextResponse.json({ 
      simplifiedSummary: "Your health comes first. Please contact your provider's billing office.",
      amountDue: "Check bill",
      dueDate: "Check bill",
      nextSteps: "Call billing directly.",
      audioUrl: null 
    }, { status: 200 });
  }
}
