
import { config } from 'dotenv';
config();

import '@/ai/flows/extract-medication-data.ts';
import '@/ai/flows/get-drug-info-flow.ts'; // Add import for the new flow
