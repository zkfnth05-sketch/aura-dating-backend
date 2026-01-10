import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  // By removing the default model here, we encourage specifying the model at the call site (e.g., in flows),
  // which makes the code more explicit and easier to debug or optimize for specific tasks.
});
