
'use server';
/**
 * @fileOverview An AI agent that extracts medication data from fax images.
 *
 * - extractMedicationData - A function that handles the medication data extraction process.
 * - ExtractMedicationDataInput - The input type for the extractMedicationData function.
 * - ExtractMedicationDataOutput - The return type for the extractMedicationData function.
 */

import {ai} from '@/ai/genkit';
import type { MedicationStatus } from '@/lib/types';
import {z} from 'genkit';

const ExtractMedicationDataInputSchema = z.object({
  faxDataUri: z
    .string()
    .describe(
      "A fax document image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractMedicationDataInput = z.infer<typeof ExtractMedicationDataInputSchema>;

// This is the external contract for the flow's output.
// It includes fields that will be deterministically set by the flow.
const ExtractMedicationDataOutputSchema = z.object({
  patientName: z.string().describe('The name of the patient.').optional().default(''),
  medicationName: z.string().describe('The name of the medication.').optional().default(''),
  dosage: z.string().describe('The dosage of the medication.').optional().default(''),
  frequency: z.string().describe('The frequency of the medication.').optional().default(''),
  prescribingDoctor: z.string().describe('The name of the prescribing doctor.').optional().default(''),
  isHandwritten: z.boolean().describe('Whether the prescription is handwritten.').optional().default(false),
  status: z.custom<MedicationStatus>().describe('The current status of the prescription.').default('pending_review'),
  parsedAt: z.string().datetime().describe('The ISO timestamp when the document was successfully parsed.'),
});
export type ExtractMedicationDataOutput = z.infer<typeof ExtractMedicationDataOutputSchema>;

export async function extractMedicationData(input: ExtractMedicationDataInput): Promise<ExtractMedicationDataOutput> {
  return extractMedicationDataFlow(input);
}

// Internal schema for what we expect the AI model to return.
// `parsedAt` and `status` are excluded as the flow will set them.
const AiModelResponseSchema = z.object({
    patientName: z.string().describe('The name of the patient.').optional().default(''),
    medicationName: z.string().describe('The name of the medication.').optional().default(''),
    dosage: z.string().describe('The dosage of the medication.').optional().default(''),
    frequency: z.string().describe('The frequency of the medication.').optional().default(''),
    prescribingDoctor: z.string().describe('The name of the prescribing doctor.').optional().default(''),
    isHandwritten: z.boolean().describe('Whether the prescription is handwritten.').optional().default(false),
});

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
  output: {schema: AiModelResponseSchema}, // AI's direct output validated against this
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

  Return the extracted information in JSON format. If a field cannot be found, use an empty string for text fields or false for boolean fields.
  Do NOT include 'status' or 'parsedAt' fields in your JSON response, as these will be handled by the system.
  `,
});

const extractMedicationDataFlow = ai.defineFlow(
  {
    name: 'extractMedicationDataFlow',
    inputSchema: ExtractMedicationDataInputSchema,
    outputSchema: ExtractMedicationDataOutputSchema, // Flow's final output adheres to this
  },
  async input => {
    const currentTimestamp = new Date().toISOString();
    const {output: aiModelOutput} = await extractMedicationDataPrompt(input);

    if (!aiModelOutput) {
      console.error("AI prompt returned null output. Returning default structure matching ExtractMedicationDataOutputSchema.");
      return {
        patientName: '',
        medicationName: '',
        dosage: '',
        frequency: '',
        prescribingDoctor: '',
        isHandwritten: false,
        status: 'pending_review', // Deterministically set
        parsedAt: currentTimestamp,  // Deterministically set
      };
    }
    
    // Combine AI output with deterministically set fields
    return {
      ...aiModelOutput,
      status: 'pending_review', // Deterministically set
      parsedAt: currentTimestamp,  // Deterministically set
    };
  }
);
