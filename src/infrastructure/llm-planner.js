import OpenAI from 'openai';
import { randomUUID } from 'node:crypto';
import { TestPlan } from '../domain/schemas.js';

/**
 * Optional LLM boundary. A provider failure must never prevent a demo run;
 * callers receive null and fall back to the deterministic planning policy.
 */
export async function askForPlan({ observation, intent }) {
  const response = await askForJson({
    system: 'You are a senior QA planner. Return one JSON object only - no markdown or commentary. It must have application (string), assumptions (string array), scenarios (array), coverageNotes (string array). Every scenario must have id, title, risk using exactly critical|high|medium|low, type using exactly happy-path|negative|edge, steps (string array), expected (string), and tags (string array). Include at least one happy-path, negative, and edge scenario. Never invent controls not in the observation.',
    input: { observation, intent }
  });
  const parsed = TestPlan.safeParse(normalizePlan(response.value));
  return parsed.success ? { plan: parsed.data, diagnostic: response.diagnostic } : { plan: null, diagnostic: response.value ? 'model response did not match the required test-plan schema' : response.diagnostic };
}

/** Provider-neutral structured request used by every reasoning agent. */
export async function askForJson({ system, input }) {
  const apiKey = process.env.LLM_API_KEY ?? process.env.OPENCODE_GO_API_KEY ?? process.env.OPENCODE_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return { value: null, diagnostic: 'no API key configured' };
  try {
    const isOpenCodeGo = Boolean(process.env.OPENCODE_GO_API_KEY) && !process.env.LLM_BASE_URL;
    const isOpenCode = Boolean(process.env.OPENCODE_API_KEY) && !process.env.LLM_BASE_URL && !isOpenCodeGo;
    const openCodeHeaders = {
      ...(isOpenCode && process.env.OPENCODE_ORG_ID ? { 'x-opencode-org-id': process.env.OPENCODE_ORG_ID } : {}),
      ...(isOpenCodeGo ? { 'x-opencode-session': `sentinel-${randomUUID()}`, 'User-Agent': 'Sentinel/0.1 autonomous-test-orchestration' } : {})
    };
    const client = new OpenAI({
      apiKey,
      ...(process.env.LLM_BASE_URL || isOpenCode || isOpenCodeGo ? { baseURL: process.env.LLM_BASE_URL ?? (isOpenCodeGo ? 'https://opencode.ai/zen/go/v1' : 'https://opencode.ai/inference/openai/v1') } : {}),
      ...(Object.keys(openCodeHeaders).length ? { defaultHeaders: openCodeHeaders } : {})
    });
    const response = await client.chat.completions.create({
      model: process.env.LLM_MODEL ?? process.env.OPENAI_MODEL ?? (isOpenCodeGo ? 'kimi-k2.7-code' : isOpenCode ? 'kimi-k2.5' : 'gpt-4.1-mini'),
      // OpenCode Go's chat-completions models currently require temperature 1.
      temperature: isOpenCodeGo ? 1 : 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(input) }
      ]
    });
    const provider = isOpenCodeGo ? 'OpenCode Go' : isOpenCode ? 'OpenCode' : 'configured provider';
    const value = parseJsonObject(response.choices[0]?.message?.content);
    return value ? { value, diagnostic: `response accepted from ${provider}` } : { value: null, diagnostic: 'model response was not valid JSON' };
  } catch (error) {
    const status = Number.isInteger(error?.status) ? `HTTP ${error.status}` : error?.name ?? 'unknown error';
    return { plan: null, diagnostic: `provider request failed (${status}: ${safeMessage(error?.message)})` };
  }
}

function parseJsonObject(content) {
  if (typeof content !== 'string') return null;
  const clean = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const object = clean.slice(clean.indexOf('{'), clean.lastIndexOf('}') + 1);
  try { return JSON.parse(object); } catch { return null; }
}

function normalizePlan(value) {
  if (!value || typeof value !== 'object') return value;
  const source = value.plan && typeof value.plan === 'object' ? value.plan : value;
  const scenarios = source.scenarios ?? source.testScenarios ?? source.test_scenarios ?? [];
  return {
    application: string(source.application ?? source.appName ?? source.applicationName, 'Target application'),
    assumptions: strings(source.assumptions),
    scenarios: Array.isArray(scenarios) ? scenarios.map((scenario, index) => ({
      id: string(scenario.id ?? scenario.scenarioId, `SC-${String(index + 1).padStart(2, '0')}`),
      title: string(scenario.title ?? scenario.name, `Scenario ${index + 1}`),
      risk: risk(scenario.risk ?? scenario.priority),
      type: type(scenario.type ?? scenario.category),
      steps: strings(scenario.steps ?? scenario.actions),
      expected: string(scenario.expected ?? scenario.expectedOutcome ?? scenario.assertion, 'Expected behaviour is observed.'),
      tags: strings(scenario.tags ?? scenario.labels)
    })) : [],
    coverageNotes: strings(source.coverageNotes ?? source.coverage_notes ?? source.notes)
  };
}
function string(value, fallback) { return typeof value === 'string' && value.trim() ? value.trim() : fallback; }
function strings(value) { return Array.isArray(value) ? value.map((item) => typeof item === 'string' ? item.trim() : String(item)).filter(Boolean) : typeof value === 'string' ? [value.trim()].filter(Boolean) : []; }
function risk(value) { const normalized = String(value ?? '').toLowerCase(); return ['critical', 'high', 'medium', 'low'].includes(normalized) ? normalized : normalized.includes('critical') ? 'critical' : normalized.includes('high') ? 'high' : normalized.includes('low') ? 'low' : 'medium'; }
function type(value) { const normalized = String(value ?? '').toLowerCase().replace(/[_ ]/g, '-'); return normalized.includes('negative') || normalized.includes('error') || normalized.includes('invalid') ? 'negative' : normalized.includes('edge') || normalized.includes('recovery') ? 'edge' : 'happy-path'; }

function safeMessage(message) {
  const compact = String(message ?? 'no provider message').replace(/\s+/g, ' ').replace(/(?:sk-|key-|token-)[A-Za-z0-9_-]+/gi, '[redacted]');
  return compact.slice(0, 180);
}
