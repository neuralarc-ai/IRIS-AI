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

const AiPoweredOpportunityForecastingInputSchema = z.object({
  opportunityName: z.string().describe('The name of the opportunity.'),
  opportunityDescription: z.string().describe('A detailed description of the opportunity.'),
  opportunityTimeline: z.string().describe('The current timeline of the opportunity, including start and end dates.'),
  opportunityValue: z.number().describe('The monetary value of the opportunity.'),
  opportunityStatus: z.string().describe('The current status of the opportunity (e.g., Need Analysis, Negotiation).'),
  recentUpdates: z.string().describe('A summary of recent updates and communications related to the opportunity.'),
  historicalContext: z.string().optional().describe('Summary of historical performance, win/loss ratio, sales cycle, and notable deals.'),
  referenceFrameworks: z.string().optional().describe('Relevant sales methodologies, frameworks, or best practices.'),
});
export type AiPoweredOpportunityForecastingInput = z.infer<typeof AiPoweredOpportunityForecastingInputSchema>;

const AiPoweredOpportunityForecastingOutputSchema = z.object({
  timelinePrediction: z.string().describe('Predicted timeline for the opportunity, including potential delays.'),
  completionDateEstimate: z.string().describe('Estimated completion date of the opportunity.'),
  revenueForecast: z.number().describe('Forecasted revenue based on the opportunity value.'),
  bottleneckIdentification: z.string().describe('Identified potential bottlenecks in the opportunity timeline.'),
});
export type AiPoweredOpportunityForecastingOutput = z.infer<typeof AiPoweredOpportunityForecastingOutputSchema>;

export async function aiPoweredOpportunityForecasting(input: AiPoweredOpportunityForecastingInput): Promise<AiPoweredOpportunityForecastingOutput> {
  return aiPoweredOpportunityForecastingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPoweredOpportunityForecastingPrompt',
  input: {schema: AiPoweredOpportunityForecastingInputSchema},
  output: {schema: AiPoweredOpportunityForecastingOutputSchema},
  prompt: `You are an expert AI sales analyst specializing in opportunity forecasting and timeline analysis.

Analyze the following opportunity details and provide a detailed forecast:

Opportunity: {{{opportunityName}}}
Description: {{{opportunityDescription}}}
Timeline: {{{opportunityTimeline}}}
Value: {{{opportunityValue}}}
Current Status: {{{opportunityStatus}}}
Recent Updates: {{{recentUpdates}}}

Historical Context: {{{historicalContext}}}
Reference Frameworks: {{{referenceFrameworks}}}

Consider the following factors in your analysis:
1. Current status and its typical duration
2. Project complexity from the description
3. Timeline feasibility
4. Value impact on stakeholder decisions
5. Industry-standard timelines for similar opportunities
6. Potential risks and delays
7. Historical performance and lessons learned
8. Relevant sales methodologies or frameworks

Provide a structured analysis with:
1. A realistic completion date estimate
2. Revenue forecast considering potential adjustments
3. Specific bottlenecks or challenges that could affect the timeline
4. Confidence level in the prediction

Format your response to match the output schema, focusing on actionable insights and specific dates/values.
Keep bottleneck identification concise but specific, highlighting the most critical potential issues.`,
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
