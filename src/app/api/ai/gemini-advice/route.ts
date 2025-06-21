import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { context, accountName } = await req.json();

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ aiAdvice: "No Gemini API key configured." }, { status: 500 });
  }

  try {
    // Format context as a list of logs
    const formattedLogs = Array.isArray(context)
      ? context.map((log: { date: string, content: string, type: string }) =>
          `- [${log.date}] ${log.content} (${log.type})`
        ).join('\n')
      : String(context);

    const prompt = `Here is the activity log for the account \"${accountName}\":\n\n${formattedLogs}\n\nBased on the above, what should the next activity log entry be? Suggest a concise, actionable next step that would move this opportunity forward. Output only the suggested log entry.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
      }
    );
    const data = await geminiResponse.json();
    const aiAdvice = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiAdvice || aiAdvice.trim() === '') {
      return NextResponse.json({ aiAdvice: "AI could not generate advice. Try adding more activity or context." }, { status: 200 });
    }
    return NextResponse.json({ aiAdvice });
  } catch (error) {
    return NextResponse.json({ aiAdvice: "AI advice could not be generated." }, { status: 500 });
  }
} 