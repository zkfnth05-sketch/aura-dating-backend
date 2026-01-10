// IMPORTANT: To deploy Genkit to Firebase, you must have the Genkit
// service account credentials available in your environment.
// See https://firebase.google.com/docs/genkit/deploy-nextjs-app-hosting#service_account
// for more details.

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { streamFlow } from '@genkit-ai/next/server';

// Initialize Genkit and required plugins.
genkit({
  plugins: [googleAI()],
});

// Create a Next.js API route handler for your flows.
export const { GET, POST } = streamFlow();

// Set the runtime to 'edge' and increase the max duration.
export const runtime = 'edge';
export const maxDuration = 120; // 2 minutes
