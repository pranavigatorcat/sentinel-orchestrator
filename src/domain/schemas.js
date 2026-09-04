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

export const CoverageReview = z.object({
  score: z.number().min(0).max(100),
  gaps: z.array(z.object({ severity: z.enum(['high', 'medium', 'low', 'info']), area: z.string(), recommendation: z.string() })),
  uncoveredRequirements: z.array(z.string()),
  decision: z.string()
});

export const GeneratedTest = z.object({
  scenarioId: z.string(), title: z.string(), source: z.string().min(20), selectors: z.array(z.string()).default([])
});
