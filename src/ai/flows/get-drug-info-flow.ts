
'use server';
/**
 * @fileOverview An AI agent that fetches conceptual drug information, like side effects.
 *
 * - getDrugInfo - A function that handles fetching drug side effects.
 * - GetDrugInfoInput - The input type for the getDrugInfo function.
 * - GetDrugInfoOutput - The return type for the getDrugInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetDrugInfoInputSchema = z.object({
  medicationName: z.string().describe('The name of the medication to get information for.'),
});
export type GetDrugInfoInput = z.infer<typeof GetDrugInfoInputSchema>;

const GetDrugInfoOutputSchema = z.object({
  sideEffects: z.array(z.string()).describe('A list of common side effects for the medication.'),
});
export type GetDrugInfoOutput = z.infer<typeof GetDrugInfoOutputSchema>;

const mockDrugData: Record<string, string[]> = {
  'amoxicillin': ['Nausea', 'Vomiting', 'Diarrhea', 'Rash', 'Allergic reactions'],
  'lisinopril': ['Dizziness', 'Cough', 'Headache', 'Fatigue', 'Increased potassium levels'],
  'metformin': ['Diarrhea', 'Nausea', 'Vomiting', 'Gas', 'Weakness'],
  'atorvastatin': ['Muscle pain', 'Diarrhea', 'Upset stomach', 'Joint pain'],
  'ibuprofen': ['Upset stomach', 'Nausea', 'Vomiting', 'Heartburn', 'Dizziness', 'Rash'],
  'prednisone': ['Increased appetite', 'Weight gain', 'Mood changes', 'Trouble sleeping', 'Increased blood sugar'],
};

// This is the actual function that simulates fetching data.
// It's defined as a tool so Genkit is aware of it, and it could potentially be used by an LLM in more complex scenarios.
const fetchDrugSideEffectsTool = ai.defineTool(
  {
    name: 'fetchDrugSideEffectsTool',
    description: 'Fetches common side effects for a given medication name from a mock database.',
    inputSchema: GetDrugInfoInputSchema,
    outputSchema: z.array(z.string()), // The tool itself outputs the array of strings
  },
  async (input) => {
    const medicationKey = input.medicationName.toLowerCase();
    if (mockDrugData[medicationKey]) {
      return mockDrugData[medicationKey];
    }
    return ['No side effect information available for this medication in the mock database.'];
  }
);

// The flow uses the tool to get the data.
// For this simple case, the flow directly calls the tool and returns its output, wrapped in the flow's output schema.
const getDrugInfoFlow = ai.defineFlow(
  {
    name: 'getDrugInfoFlow',
    inputSchema: GetDrugInfoInputSchema,
    outputSchema: GetDrugInfoOutputSchema,
  },
  async (input) => {
    const sideEffects = await fetchDrugSideEffectsTool(input); // Call the tool
    return { sideEffects };
  }
);

// Exported wrapper function to be called from the UI
export async function getDrugInfo(input: GetDrugInfoInput): Promise<GetDrugInfoOutput> {
  return getDrugInfoFlow(input);
}
