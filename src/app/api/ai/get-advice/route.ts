import { NextRequest, NextResponse } from 'next/server';
// Import summarizeUpdate from the AI flows
import { summarizeUpdate } from '@/ai/flows/intelligent-insights';

// Helper: Check if a log is too short or generic
function isLogGeneric(log: string) {
  if (!log) return true;
  const trimmed = log.trim();
  if (trimmed.length < 10) return true;
  // Add more generic checks as needed
  const genericPhrases = [
    'update', 'call', 'meeting', 'emailed', 'followed up', 'checked in', 'touch base', 'spoke', 'talked', 'no new updates', 'n/a', 'none'
  ];
  return genericPhrases.some(phrase => trimmed.toLowerCase() === phrase);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('BODY:', body); // Log the request body
    const { logs, context } = body;

    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ error: 'No logs provided.' }, { status: 400 });
    }

    const allGeneric = logs.every(isLogGeneric);
    if (allGeneric) {
      return NextResponse.json({
        advice: '',
        warning: 'Please provide more detailed updates or logs for meaningful AI advice.'
      });
    }

    // Compose update content for Gemini
    const updateContent = logs.join('\n');

    // Call Gemini via summarizeUpdate
    const aiResult = await summarizeUpdate({ updateContent });

    if (!aiResult || !aiResult.summary) {
      return NextResponse.json({
        advice: '',
        warning: 'AI could not generate advice. Please provide more detailed updates.'
      });
    }

    return NextResponse.json({
      advice: aiResult.summary,
      actionItems: aiResult.actionItems,
      followUpSuggestions: aiResult.followUpSuggestions
    });
  } catch (err) {
    console.error('API ERROR:', err); // Log the error
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
} 