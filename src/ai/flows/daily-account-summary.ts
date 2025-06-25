'use server';

/**
 * @fileOverview AI-powered daily summary reports for each account.
 *
 * - generateDailyAccountSummary - A function that generates a daily summary report for a given account.
 * - GenerateDailyAccountSummaryInput - The input type for the generateDailyAccountSummary function.
 * - GenerateDailyAccountSummaryOutput - The return type for the generateDailyAccountSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDailyAccountSummaryInputSchema = z.object({
  accountId: z.string().describe('The ID of the account to generate a summary for.'),
  accountName: z.string().describe('The name of the account.'),
  recentUpdates: z.string().describe('A summary of recent updates for the account.'),
  keyMetrics: z.string().describe('Key metrics for the account.'),
});
export type GenerateDailyAccountSummaryInput = z.infer<
  typeof GenerateDailyAccountSummaryInputSchema
>;

const GenerateDailyAccountSummaryOutputSchema = z.object({
  summary: z.string().describe('A daily summary report for the account.'),
  relationshipHealth: z.string().describe('An indicator of the relationship health with the account.'),
});
export type GenerateDailyAccountSummaryOutput = z.infer<
  typeof GenerateDailyAccountSummaryOutputSchema
>;

export async function generateDailyAccountSummary(
  input: GenerateDailyAccountSummaryInput
): Promise<GenerateDailyAccountSummaryOutput> {
  return generateDailyAccountSummaryFlow(input);
}

const getRelationshipHealth = ai.defineTool({
  name: 'getRelationshipHealth',
  description: 'Determines the health of the relationship with the given account.',
  inputSchema: z.object({
    accountName: z.string().describe('The name of the account.'),
    recentUpdates: z.string().describe('A summary of recent updates for the account.'),
    keyMetrics: z.string().describe('Key metrics for the account.'),
  }),
  outputSchema: z.string().describe('A short description of the relationship health (e.g., healthy, at risk, needs attention).'),
},
async (input) => {
    // Improved: flag at risk if no updates in 14 days
    if (input.recentUpdates && input.recentUpdates.includes('No engagement in the last 2 weeks')) {
      return `The relationship with ${input.accountName} is at risk due to lack of recent engagement.`;
    }
    return `The relationship with ${input.accountName} is currently healthy based on recent updates and key metrics.`;
  }
);

const prompt = ai.definePrompt({
  name: 'generateDailyAccountSummaryPrompt',
  input: {schema: GenerateDailyAccountSummaryInputSchema},
  output: {schema: GenerateDailyAccountSummaryOutputSchema},
  tools: [getRelationshipHealth],
  prompt: `You are an expert AI account manager. Analyze the following account's real engagement and key metrics to generate a concise, actionable daily summary.

Account Name: {{{accountName}}}
Recent Updates: {{{recentUpdates}}}
Key Metrics: {{{keyMetrics}}}

Your summary must:
- Reference specific engagement patterns (e.g., high activity, no contact, declining engagement, etc.)
- Highlight any risks or opportunities (e.g., stalled deals, strong momentum, lack of updates)
- Suggest next best actions for the account team
- Use clear, natural, and executive-level language
- Be dynamic and reflect the actual data above, not just a generic template

Also, use the getRelationshipHealth tool to assess the relationship health based on the engagement and metrics.

Example style:
"Today's summary for {{accountName}}: Engagement has been moderate with 2 updates in the last 14 days. No client contact in 10 days signals a risk of declining momentum. Recommend scheduling a check-in call this week to re-engage the client and discuss next steps. Relationship health: at risk."

Return the summary in the 'summary' field and the relationship health in the 'relationshipHealth' field.
`,
});

const generateDailyAccountSummaryFlow = ai.defineFlow(
  {
    name: 'generateDailyAccountSummaryFlow',
    inputSchema: GenerateDailyAccountSummaryInputSchema,
    outputSchema: GenerateDailyAccountSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
