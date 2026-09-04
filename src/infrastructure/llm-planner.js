import OpenAI from 'openai';
import { TestPlan } from '../domain/schemas.js';

/**
 * Optional LLM boundary. A provider failure must never prevent a demo run;
 * callers receive null and fall back to the deterministic planning policy.
 */
export async function askForPlan({ observation, intent }) {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini', temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a senior QA planner. Produce JSON only with application, assumptions, scenarios, and coverageNotes. Scenarios must contain id, title, risk (critical|high|medium|low), type (happy-path|negative|edge), steps, expected, tags. Never invent controls not in the observation.' },
        { role: 'user', content: JSON.stringify({ observation, intent }) }
      ]
    });
    return TestPlan.safeParse(JSON.parse(response.choices[0]?.message?.content ?? 'null')).success ? TestPlan.parse(JSON.parse(response.choices[0].message.content)) : null;
  } catch { return null; }
}
