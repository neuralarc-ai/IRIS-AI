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

    const prompt = `As an AI sales assistant, analyze this update for ${accountName || 'the account'}:

${formattedLogs}

Based on this update, provide a brief, actionable suggestion for the next best step. Consider:
1. Follow-up actions needed
2. Potential opportunities to explore
3. Ways to strengthen the relationship
4. Any risks to address

Focus on providing specific, practical advice that moves the relationship forward. Keep the response concise and action-oriented.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ text: prompt }],
            role: "user"
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      }
    );

    const data = await geminiResponse.json();
    const aiAdvice = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    // If no advice was generated, provide a default suggestion based on the context
    if (!aiAdvice || aiAdvice.trim() === '') {
      const defaultAdvice = generateDefaultAdvice(context);
      return NextResponse.json({ aiAdvice: defaultAdvice });
    }

    return NextResponse.json({ aiAdvice });
  } catch (error) {
    console.error('Error generating advice:', error);
    const defaultAdvice = generateDefaultAdvice(context);
    return NextResponse.json({ aiAdvice: defaultAdvice });
  }
}

function generateDefaultAdvice(context: string | any[]): string {
  // Extract keywords from context
  const contextStr = Array.isArray(context) ? context.map(c => c.content).join(' ') : String(context);
  const keywords = contextStr.toLowerCase();

  // Provide contextual default advice based on keywords
  if (keywords.includes('meet') || keywords.includes('meeting')) {
    return "Schedule a follow-up meeting to discuss action items and next steps. Send a summary email to confirm key points discussed.";
  }
  if (keywords.includes('call') || keywords.includes('phone')) {
    return "Send a brief email summarizing the key points from the call and outline the next steps agreed upon.";
  }
  if (keywords.includes('email') || keywords.includes('sent')) {
    return "Follow up in 2-3 days if no response is received. Consider scheduling a call to discuss in more detail.";
  }
  if (keywords.includes('proposal') || keywords.includes('quote')) {
    return "Schedule a review call to walk through the proposal details and address any questions or concerns.";
  }
  if (keywords.includes('issue') || keywords.includes('problem') || keywords.includes('concern')) {
    return "Schedule an urgent follow-up call to address concerns and develop an action plan for resolution.";
  }
  
  // Generic advice if no specific keywords are found
  return "Schedule a follow-up conversation to discuss progress and identify any additional needs or opportunities.";
} 