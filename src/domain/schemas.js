import { z } from 'zod';

export const StartRun = z.object({
  url: z.string().url('Enter a complete URL, such as https://example.com'),
  intent: z.string().max(500).optional().default(''),
  prd: z.string().max(12000).optional().default(''),
  demoMode: z.boolean().default(true)
});

export const Scenario = z.object({
  id: z.string(), title: z.string(), risk: z.enum(['critical', 'high', 'medium', 'low']),
  type: z.enum(['happy-path', 'negative', 'edge']), steps: z.array(z.string()), expected: z.string(), tags: z.array(z.string())
});

export const TestPlan = z.object({
  application: z.string(), assumptions: z.array(z.string()), scenarios: z.array(Scenario), coverageNotes: z.array(z.string())
});
