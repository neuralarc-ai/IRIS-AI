// Implemented AI-powered opportunity forecasting flow to provide timeline predictions, completion date estimates, and bottleneck identification.

'use server';

/**
 * @fileOverview Implements AI-powered forecasting features for opportunity management.
 *
 * - aiPoweredOpportunityForecasting - A function that provides opportunity timeline predictions, completion date estimates, and bottleneck identification.
 * - AiPoweredOpportunityForecastingInput - The input type for the aiPoweredOpportunityForecasting function.
 * - AiPoweredOpportunityForecastingOutput - The return type for the aiPoweredOpportunityForecasting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiPoweredOpportunityForecastingInputSchema = z.object({ // Renamed
  opportunityName: z.string().describe('The name of the opportunity.'), // Renamed
  opportunityDescription: z.string().describe('A detailed description of the opportunity.'), // Renamed
  opportunityTimeline: z.string().describe('The current timeline of the opportunity, including start and end dates.'), // Renamed
  opportunityValue: z.number().describe('The monetary value of the opportunity.'), // Renamed
  opportunityStatus: z.string().describe('The current status of the opportunity (e.g., Need Analysis, Negotiation).'), // Renamed
  recentUpdates: z.string().describe('A summary of recent updates and communications related to the opportunity.'),
});
export type AiPoweredOpportunityForecastingInput = z.infer<typeof AiPoweredOpportunityForecastingInputSchema>; // Renamed

const AiPoweredOpportunityForecastingOutputSchema = z.object({ // Renamed
  timelinePrediction: z.string().describe('Predicted timeline for the opportunity, including potential delays.'),
  completionDateEstimate: z.string().describe('Estimated completion date of the opportunity.'),
  revenueForecast: z.number().describe('Forecasted revenue based on the opportunity value.'),
  bottleneckIdentification: z.string().describe('Identified potential bottlenecks in the opportunity timeline.'),
});
export type AiPoweredOpportunityForecastingOutput = z.infer<typeof AiPoweredOpportunityForecastingOutputSchema>; // Renamed

export async function aiPoweredOpportunityForecasting(input: AiPoweredOpportunityForecastingInput): Promise<AiPoweredOpportunityForecastingOutput> { // Renamed
  return aiPoweredOpportunityForecastingFlow(input); // Renamed
}

const prompt = ai.definePrompt({
  name: 'aiPoweredOpportunityForecastingPrompt',
  input: {schema: AiPoweredOpportunityForecastingInputSchema},
  output: {schema: AiPoweredOpportunityForecastingOutputSchema},
  prompt: `You are an expert AI sales strategy analyst. Your job is to provide a holistic, prioritized, and actionable summary for each sales opportunity, using natural, executive-level language.

Given the following opportunity details, generate a comprehensive forecast and strategic summary:

Opportunity: {{{opportunityName}}}
Description: {{{opportunityDescription}}}
Timeline: {{{opportunityTimeline}}}
Value: {{{opportunityValue}}}
Current Status: {{{opportunityStatus}}}
Recent Updates: {{{recentUpdates}}}

Your analysis must:
- Give a holistic, prioritized summary of the opportunity's outlook and momentum
- Highlight the top opportunities and the most significant risks, referencing both the provided data and any patterns you detect (e.g., deals stalling, leads not contacted, declining engagement, etc.)
- Suggest the next best actions for the sales team to maximize success or mitigate risk
- Assign a score or rank to each key item (e.g., "high potential", "at risk", "needs follow-up"), and explain your reasoning
- Reference internal signals such as engagement, update frequency, and deal stage
- Use clear, natural, and insight-driven language suitable for an executive dashboard

Format your response to match the output schema, but ensure the timelinePrediction and bottleneckIdentification fields are written in this holistic, prioritized, and actionable style. The completionDateEstimate and revenueForecast should be as precise as possible, but the rest should read as a natural-language summary, not a list of bullet points.

Example style:
"This opportunity is showing strong momentum and is ranked as 'high potential' due to recent positive client engagement and timely progress. However, there is a moderate risk of delay if stakeholder alignment is not maintained. Next action: schedule a follow-up with the client to confirm decision timelines."

Be concise but insightful, and always prioritize clarity and actionability.`,
});

const aiPoweredOpportunityForecastingFlow = ai.defineFlow(
  {
    name: 'aiPoweredOpportunityForecastingFlow',
    inputSchema: AiPoweredOpportunityForecastingInputSchema,
    outputSchema: AiPoweredOpportunityForecastingOutputSchema,
  },
  async (input): Promise<AiPoweredOpportunityForecastingOutput> => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        console.warn(`AI prompt for ${input.opportunityName} did not return an output.`);
        return {
          timelinePrediction: "Timeline prediction unavailable",
          completionDateEstimate: input.opportunityTimeline.includes("End:") 
            ? input.opportunityTimeline.split("End:")[1].trim()
            : "Date estimation requires more context",
          revenueForecast: input.opportunityValue,
          bottleneckIdentification: "Analysis requires more detailed opportunity information.",
        };
      }
      return output;
    } catch (error: any) {
      console.error(`Error in aiPoweredOpportunityForecastingFlow for ${input.opportunityName}:`, error.message || error);
      let bottleneckMessage = "Analysis temporarily unavailable. Please try again.";
      
      if (error.message && typeof error.message === 'string') {
        if (error.message.includes("429 Too Many Requests") || (error.cause && typeof error.cause === 'string' && error.cause.includes("429"))) {
          bottleneckMessage = "System is currently busy. Please try again in a few minutes.";
        } else if (error.message.includes("AI prompt did not return an output")) {
          bottleneckMessage = "Unable to analyze this opportunity at the moment.";
        } else if (error.message.includes("blocked") || error.message.includes("Safety rating violated")) {
          bottleneckMessage = "Content analysis temporarily restricted.";
        }
      }
      
      // Extract timeline from input if possible
      const endDate = input.opportunityTimeline.includes("End:") 
        ? input.opportunityTimeline.split("End:")[1].trim()
        : "Timeline analysis pending";
      
      return {
        timelinePrediction: "Timeline analysis pending",
        completionDateEstimate: endDate,
        revenueForecast: input.opportunityValue,
        bottleneckIdentification: bottleneckMessage,
      };
    }
  }
);
