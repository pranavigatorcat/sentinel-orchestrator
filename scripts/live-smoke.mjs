import { existsSync, readFileSync } from 'node:fs';
import { RunOrchestrator } from '../src/orchestrator/run-orchestrator.js';

const envFile = new URL('../.env', import.meta.url);
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}
if (!process.env.OPENCODE_GO_API_KEY && !process.env.OPENCODE_API_KEY && !process.env.LLM_API_KEY && !process.env.OPENAI_API_KEY) {
  throw new Error('No provider key configured in .env.');
}

let plannerStrategy = 'not reached';
const strategies = {};
const result = await new RunOrchestrator({
  url: 'https://www.saucedemo.com/',
  intent: 'Focus on login, cart, checkout, invalid credentials, and validation.',
  prd: 'Users must be able to authenticate, add an item to cart, complete checkout, and see clear validation feedback.',
  demoMode: false
}, (event) => {
  if (event.type === 'planner.plan-ready') plannerStrategy = event.payload.strategy;
  if (event.type === 'critic.coverage-reviewed') strategies.critic = event.payload.strategy;
  if (event.type === 'generator.tests-ready') strategies.generator = event.payload.strategy;
  if (event.type === 'healer.interventions-ready') strategies.healer = event.payload.strategy;
  if (event.type === 'stage.started') console.log(`▶ ${event.payload.name}`);
  if (event.type === 'stage.completed') console.log(`✓ ${event.payload.name}`);
}).run();

console.log(JSON.stringify({
  plannerStrategy,
  strategies,
  application: result.plan.application,
  scenarios: result.plan.scenarios.length,
  coverageScore: result.coverage.score,
  outcomes: result.results.map((outcome) => outcome.status),
  verdict: result.report.verdict
}, null, 2));

if (plannerStrategy !== 'structured-llm') process.exitCode = 1;
