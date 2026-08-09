import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    const apiKey = process.env.GEMINI_API_KEY || '';

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: file.type || 'image/jpeg',
                    data: base64Image
                  }
                },
                {
                  text: "Extract text from this medical bill. Summarize it at a 5th-grade reading level. Extract Total Amount Due, Due Date, and an empathetic Next Step. Output strict JSON matching: { \"simplifiedSummary\": string, \"amountDue\": string, \"dueDate\": string, \"nextSteps\": string }"
                }
              ]
            }
          ]
        })
      }
    );

    const geminiData = await geminiRes.json();
    const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    let billData;
    try {
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      billData = JSON.parse(cleanJson);
    } catch (e) {
      billData = {
        simplifiedSummary: "We couldn't fully parse the bill details, but your health comes first. Please contact your billing department.",
        amountDue: "Check bill",
        dueDate: "Check bill",
        nextSteps: "Call your provider's billing office directly."
      };
    }

    let audioUrl = null;
    try {
      const ttsRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          body: JSON.stringify({
            text: billData.simplifiedSummary,
            model_id: 'eleven_monolingual_v1',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
          })
        }
      );

      if (ttsRes.ok) {
        const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());
        const fileName = `${Date.now()}-audio.mp3`;
        const { error: uploadError } = await supabase.storage
          .from('audio_files')
          .upload(fileName, audioBuffer, { contentType: 'audio/mpeg' });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('audio_files')
            .getPublicUrl(fileName);
          audioUrl = publicUrlData.publicUrl;
        }
      }
    } catch (ttsErr) {
      console.error('TTS generation failed:', ttsErr);
    }

    return NextResponse.json({ ...billData, audioUrl });

  } catch (error: any) {
    console.error('Error processing web upload:', error);
    return NextResponse.json({ error: error.message || 'Failed to process bill' }, { status: 500 });
  }
}
