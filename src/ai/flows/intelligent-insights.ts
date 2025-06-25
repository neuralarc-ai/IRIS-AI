'use server';

/**
 * @fileOverview AI-powered intelligent insights flow for analyzing communication patterns, sentiment,
 * and summarizing updates to enhance decision-making.
 *
 * - analyzeCommunication - Analyzes communication patterns to identify key insights.
 * - summarizeUpdate - Summarizes lengthy updates, extracts action items, and suggests follow-ups.
 * - IntelligentInsightsInput - The input type for the intelligent insights flow.
 * - IntelligentInsightsOutput - The output type for the intelligent insights flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CommunicationAnalysisInputSchema = z.object({
  communicationHistory: z
    .string()
    .describe('The history of communication with a client or account.'),
});

export type CommunicationAnalysisInput = z.infer<typeof CommunicationAnalysisInputSchema>;

const CommunicationAnalysisOutputSchema = z.object({
  keyInsights: z.string().describe('Key insights derived from the communication history.'),
  sentimentAnalysis: z.string().describe('Sentiment analysis of the communication.'),
});

export type CommunicationAnalysisOutput = z.infer<typeof CommunicationAnalysisOutputSchema>;

const UpdateSummaryInputSchema = z.object({
  updateContent: z.string().describe('The content of the update to be summarized.'),
});

export type UpdateSummaryInput = z.infer<typeof UpdateSummaryInputSchema>;

const UpdateSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the update content.'),
  actionItems: z.string().describe('Action items extracted from the update content.'),
  followUpSuggestions: z
    .string()
    .describe('Suggestions for follow-up actions based on the update.'),
});

export type UpdateSummaryOutput = z.infer<typeof UpdateSummaryOutputSchema>;

const RelationshipHealthInputSchema = z.object({
  communicationHistory: z
    .string()
    .describe('The history of communication with a client or account.'),
});

const RelationshipHealthOutputSchema = z.object({
  healthScore: z.number().describe('A numerical score representing the relationship health (0.0 to 1.0).'),
  summary: z.string().describe('A concise summary explaining the relationship health score.'),
  trends: z.array(z.string()).describe('Key trends identified in the relationship.'),
  recommendations: z.array(z.string()).describe('Specific recommendations for improving or maintaining the relationship.'),
  riskIndicators: z.array(z.string()).describe('Potential risk factors that need attention.'),
  strengthAreas: z.array(z.string()).describe('Areas where the relationship shows particular strength.'),
});
export type RelationshipHealthOutput = z.infer<typeof RelationshipHealthOutputSchema>;


const relationshipHealthTool = ai.defineTool({
  name: 'getRelationshipHealth',
  description: 'Returns a comprehensive relationship health analysis based on communication history.',
  inputSchema: RelationshipHealthInputSchema,
  outputSchema: RelationshipHealthOutputSchema,
},
async (input) => {
  // Extract key indicators from communication history
  const history = input.communicationHistory.toLowerCase();
  let score = 0.5;
  let factors = [];
  let trends = [];
  let recommendations = [];
  let riskIndicators = [];
  let strengthAreas = [];
  
  // Analyze communication frequency and depth
  const wordCount = history.split(' ').length;
  if (wordCount > 200) {
    score += 0.1;
    factors.push("detailed communication");
    strengthAreas.push("Maintains detailed and thorough communication");
  } else {
    recommendations.push("Increase communication detail and frequency");
  }
  
  // Analyze positive indicators
  const positiveTerms = ['success', 'great', 'excellent', 'thank', 'appreciate', 'progress', 'agree', 'excited', 'happy', 'pleased'];
  const positiveCount = positiveTerms.filter(term => history.includes(term)).length;
  score += (positiveCount * 0.05);
  if (positiveCount > 2) {
    factors.push("strong positive sentiment");
    strengthAreas.push("Consistently positive interactions");
    trends.push("Maintaining positive engagement");
  } else if (positiveCount > 0) {
    factors.push("positive sentiment");
  } else {
    recommendations.push("Work on building more positive interactions");
    riskIndicators.push("Limited positive sentiment in communications");
  }

  // Analyze engagement indicators
  const engagementTerms = ['meeting', 'call', 'discuss', 'follow up', 'schedule', 'plan', 'sync', 'review'];
  const engagementCount = engagementTerms.filter(term => history.includes(term)).length;
  score += (engagementCount * 0.05);
  if (engagementCount > 2) {
    factors.push("high engagement");
    strengthAreas.push("Regular and proactive engagement");
    trends.push("Maintaining consistent communication cadence");
  } else if (engagementCount > 0) {
    factors.push("moderate engagement");
    recommendations.push("Increase frequency of check-ins and meetings");
  } else {
    riskIndicators.push("Low engagement level");
    recommendations.push("Schedule regular check-ins to maintain engagement");
  }

  // Analyze potential concerns
  const concernTerms = ['issue', 'problem', 'delay', 'concern', 'worried', 'missed', 'late', 'escalate', 'urgent'];
  const concernCount = concernTerms.filter(term => history.includes(term)).length;
  score -= (concernCount * 0.05);
  if (concernCount > 2) {
    factors.push("multiple concerns noted");
    riskIndicators.push("Multiple issues or concerns raised");
    recommendations.push("Address outstanding concerns promptly");
    trends.push("Increasing number of concerns");
  } else if (concernCount > 0) {
    factors.push("some concerns noted");
    recommendations.push("Proactively follow up on noted concerns");
  }

  // Analyze collaboration indicators
  const collaborationTerms = ['team', 'together', 'collaborate', 'partnership', 'solution', 'align', 'joint', 'shared'];
  const collaborationCount = collaborationTerms.filter(term => history.includes(term)).length;
  score += (collaborationCount * 0.05);
  if (collaborationCount > 2) {
    factors.push("strong collaboration");
    strengthAreas.push("Strong collaborative partnership");
    trends.push("Growing partnership strength");
  } else if (collaborationCount > 0) {
    factors.push("good collaboration");
    recommendations.push("Look for more opportunities to collaborate");
  } else {
    recommendations.push("Foster more collaborative interactions");
  }

  // Analyze decision-making indicators
  const decisionTerms = ['agree', 'decision', 'approve', 'move forward', 'next steps', 'timeline'];
  const decisionCount = decisionTerms.filter(term => history.includes(term)).length;
  if (decisionCount > 2) {
    strengthAreas.push("Clear decision-making process");
    trends.push("Efficient decision-making");
  } else {
    recommendations.push("Work on clarifying decision-making processes");
  }

  // Normalize score between 0 and 1
  score = Math.max(0, Math.min(1, score));

  // Generate summary based on factors and score
  let summary = "";
  if (score >= 0.8) {
    summary = `The relationship is very strong. ${factors.join(", ")} indicate excellent engagement and positive momentum. Continue building on current success while monitoring for any emerging needs.`;
  } else if (score >= 0.6) {
    summary = `The relationship is healthy. ${factors.join(", ")} show good progress, with opportunities for deeper engagement. Focus on strengthening specific areas while maintaining current positive trends.`;
  } else if (score >= 0.4) {
    summary = `The relationship is stable. ${factors.join(", ")} suggest moderate engagement, with clear opportunities for strengthening the partnership. Consider implementing recommended actions to improve engagement.`;
  } else if (score >= 0.2) {
    summary = `The relationship needs attention. ${factors.join(", ")} indicate challenges that should be addressed proactively. Focus on addressing risk factors while building on existing strengths.`;
  } else {
    summary = `The relationship requires immediate attention. Limited positive indicators found in recent communications. Implement recommended actions promptly to improve relationship health.`;
  }

  // Ensure we always have some recommendations
  if (recommendations.length === 0) {
    recommendations.push("Maintain current engagement levels", "Look for opportunities to deepen the partnership");
  }

  return {
    healthScore: parseFloat(score.toFixed(2)),
    summary,
    trends: trends.length > 0 ? trends : ["Insufficient history to determine trends"],
    recommendations,
    riskIndicators: riskIndicators.length > 0 ? riskIndicators : ["No significant risks identified"],
    strengthAreas: strengthAreas.length > 0 ? strengthAreas : ["Building initial relationship foundation"],
  };
});

export async function analyzeCommunication(input: CommunicationAnalysisInput): Promise<CommunicationAnalysisOutput> {
  return analyzeCommunicationFlow(input);
}

export async function summarizeUpdate(input: UpdateSummaryInput): Promise<UpdateSummaryOutput> {
  return summarizeUpdateFlow(input);
}

const analyzeCommunicationPrompt = ai.definePrompt({
  name: 'analyzeCommunicationPrompt',
  input: {schema: CommunicationAnalysisInputSchema},
  output: {schema: CommunicationAnalysisOutputSchema},
  prompt: `You are an AI assistant specializing in analyzing communication patterns and sentiment.

  Analyze the following communication history and provide key insights and a sentiment analysis.

  Communication History: {{{communicationHistory}}}`,
});

const summarizeUpdatePrompt = ai.definePrompt({
  name: 'summarizeUpdatePrompt',
  input: {schema: UpdateSummaryInputSchema},
  output: {schema: UpdateSummaryOutputSchema},
  prompt: `You are an AI assistant specializing in sales and CRM updates. Summarize the following update content into a single, concise log entry suitable for direct entry into a CRM. Capture the key actions, outcomes, and next steps in a brief, readable sentence or two. Do not include section headers, bullet points, or extra commentary—just the log description.\n\nUpdate Content: {{{updateContent}}}`,
});

const analyzeCommunicationFlow = ai.defineFlow(
  {
    name: 'analyzeCommunicationFlow',
    inputSchema: CommunicationAnalysisInputSchema,
    outputSchema: CommunicationAnalysisOutputSchema,
  },
  async input => {
    const {output} = await analyzeCommunicationPrompt(input);
    return output!;
  }
);

const summarizeUpdateFlow = ai.defineFlow(
  {
    name: 'summarizeUpdateFlow',
    inputSchema: UpdateSummaryInputSchema,
    outputSchema: UpdateSummaryOutputSchema,
  },
  async input => {
    const {output} = await summarizeUpdatePrompt(input);
    return output!;
  }
);

const relationshipHealthPrompt = ai.definePrompt({
  name: 'relationshipHealthPrompt',
  tools: [relationshipHealthTool],
  input: {schema: CommunicationAnalysisInputSchema},
  output: {schema: RelationshipHealthOutputSchema}, 
  prompt: `You are an expert relationship manager analyzing client communications.

Based on the following communication history, analyze the relationship health considering:
1. Communication frequency and quality
2. Sentiment and tone
3. Engagement level
4. Collaboration indicators
5. Any potential concerns or issues

Use the getRelationshipHealth tool to generate a detailed assessment.

Communication History: {{{communicationHistory}}}

Provide a comprehensive health score and detailed summary that reflects the current state of the relationship.`,
});

export type IntelligentInsightsInput = {
  communicationHistory: string;
};

export type IntelligentInsightsOutput = {
  communicationAnalysis: CommunicationAnalysisOutput | null;
  updateSummary: UpdateSummaryOutput | null;
  relationshipHealth: RelationshipHealthOutput | null;
};


const intelligentInsightsFlow = ai.defineFlow(
  {
    name: 'intelligentInsightsFlow',
    inputSchema: z.object({ communicationHistory: z.string() }),
    outputSchema: z.object({
      communicationAnalysis: CommunicationAnalysisOutputSchema.nullable(),
      updateSummary: UpdateSummaryOutputSchema.nullable(),
      relationshipHealth: RelationshipHealthOutputSchema.nullable(),
    }),
  },
  async (input: IntelligentInsightsInput): Promise<IntelligentInsightsOutput> => {
    let communicationAnalysisResult: CommunicationAnalysisOutput | null = null;
    let updateSummaryResult: UpdateSummaryOutput | null = null;
    let relationshipHealthResult: RelationshipHealthOutput | null = null;

    try {
      communicationAnalysisResult = await analyzeCommunicationFlow({
        communicationHistory: input.communicationHistory,
      });
    } catch (error) {
      console.error("Error in analyzeCommunicationFlow:", error);
      // communicationAnalysisResult remains null
    }

    try {
      updateSummaryResult = await summarizeUpdateFlow({
        updateContent: input.communicationHistory, 
      });
    } catch (error) {
      console.error("Error in summarizeUpdateFlow:", error);
      // updateSummaryResult remains null
    }

    try {
      const { output } = await relationshipHealthPrompt({
        communicationHistory: input.communicationHistory,
      });
      relationshipHealthResult = output;
    } catch (error) {
      console.error("Error in relationshipHealthPrompt:", error);
      // relationshipHealthResult remains null
    }

    return {
      communicationAnalysis: communicationAnalysisResult,
      updateSummary: updateSummaryResult,
      relationshipHealth: relationshipHealthResult,
    };
  }
);

export async function generateInsights(input: IntelligentInsightsInput): Promise<IntelligentInsightsOutput> {
  return intelligentInsightsFlow(input);
}
