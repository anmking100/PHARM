'use server';
/**
 * @fileOverview An AI agent that extracts medication data from fax images.
 *
 * - extractMedicationData - A function that handles the medication data extraction process.
 * - ExtractMedicationDataInput - The input type for the extractMedicationData function.
 * - ExtractMedicationDataOutput - The return type for the extractMedicationData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractMedicationDataInputSchema = z.object({
  faxDataUri: z
    .string()
    .describe(
      "A fax document image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractMedicationDataInput = z.infer<typeof ExtractMedicationDataInputSchema>;

const ExtractMedicationDataOutputSchema = z.object({
  patientName: z.string().describe('The name of the patient.'),
  medicationName: z.string().describe('The name of the medication.'),
  dosage: z.string().describe('The dosage of the medication.'),
  frequency: z.string().describe('The frequency of the medication.'),
  prescribingDoctor: z.string().describe('The name of the prescribing doctor.'),
  isHandwritten: z.boolean().describe('Whether the prescription is handwritten.'),
});
export type ExtractMedicationDataOutput = z.infer<typeof ExtractMedicationDataOutputSchema>;

export async function extractMedicationData(input: ExtractMedicationDataInput): Promise<ExtractMedicationDataOutput> {
  return extractMedicationDataFlow(input);
}

const shouldInterpretHandwritingTool = ai.defineTool({
    name: 'shouldInterpretHandwriting',
    description: 'Determines whether the given text is handwritten and requires special interpretation.',
    inputSchema: z.object({
        text: z.string().describe('The text to analyze.')
    }),
    outputSchema: z.boolean(),
    async execute(input) {
        // In a real implementation, this would use an LLM or other service to determine if the text is handwritten.
        // For this example, we will always return false.
        return false;
    }
});

const extractMedicationDataPrompt = ai.definePrompt({
  name: 'extractMedicationDataPrompt',
  input: {schema: ExtractMedicationDataInputSchema},
  output: {schema: ExtractMedicationDataOutputSchema},
  tools: [shouldInterpretHandwritingTool],
  prompt: `You are an expert pharmacist assistant whose job is to extract structured information from faxes of medication prescriptions. 

  Analyze the provided fax image and extract the following information:

  - Patient Name: The full name of the patient.
  - Medication Name: The name of the prescribed medication.
  - Dosage: The prescribed dosage of the medication.
  - Frequency: How often the medication should be taken.
  - Prescribing Doctor: The name of the doctor who prescribed the medication.

  Based on the image, determine if the prescription appears to be handwritten. Use the 'shouldInterpretHandwriting' tool if needed to determine if the fax contains handwriting.

  Here is the fax image: {{media url=faxDataUri}}

  Return the extracted information in JSON format.
  `,
});

const extractMedicationDataFlow = ai.defineFlow(
  {
    name: 'extractMedicationDataFlow',
    inputSchema: ExtractMedicationDataInputSchema,
    outputSchema: ExtractMedicationDataOutputSchema,
  },
  async input => {
    const {output} = await extractMedicationDataPrompt(input);
    return output!;
  }
);
