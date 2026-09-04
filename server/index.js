import express from 'express';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RunOrchestrator } from '../src/orchestrator/run-orchestrator.js';
import { StartRun } from '../src/domain/schemas.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadLocalEnv(path.join(root, '.env'));
const app = express();
const runs = new Map();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(root, 'web')));

app.post('/api/runs', async (req, res) => {
  const parsed = StartRun.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' });
  const run = { id: randomUUID(), events: new EventEmitter(), history: [], state: 'queued', result: null };
  runs.set(run.id, run);
  res.status(202).json({ id: run.id });
  const publish = (event) => {
    run.history.push(event);
    logMissionEvent(run.id, event);
    run.events.emit('event', event);
  };
  queueMicrotask(async () => {
    try {
      run.state = 'running';
      run.result = await new RunOrchestrator(parsed.data, publish).run();
      run.state = 'complete';
      publish({ type: 'run.complete', payload: run.result });
    } catch (error) {
      run.state = 'failed';
      publish({ type: 'run.failed', payload: { message: error.message } });
    }
  });
});

app.get('/api/runs/:id/events', (req, res) => {
  const run = runs.get(req.params.id);
  if (!run) return res.status(404).end();
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);
  const listener = (event) => send(event);
  run.events.on('event', listener);
  // The showcase pipeline is intentionally fast. Replay events that happened
  // before EventSource connected so the UI never loses its decision trail.
  run.history.forEach(send);
  req.on('close', () => run.events.off('event', listener));
});

app.get('/{*splat}', (_req, res) => res.sendFile(path.join(root, 'web', 'index.html')));
const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`Sentinel workbench: http://localhost:${port}`));

function logMissionEvent(runId, event) {
  const tag = `[mission ${runId.slice(0, 8)}]`;
  if (event.type === 'stage.started') return console.log(`${tag} ▶ ${event.payload.name}`);
  if (event.type === 'stage.completed') return console.log(`${tag} ✓ ${event.payload.name}`);
  if (event.type === 'planner.plan-ready') return console.log(`${tag}   Planner: ${event.payload.plan.scenarios.length} scenarios for ${event.payload.plan.application} [${event.payload.strategy}]`);
  if (event.type === 'critic.coverage-reviewed') return console.log(`${tag}   Critic: ${event.payload.score}% confidence, ${event.payload.gaps.length} visible risk(s) [${event.payload.strategy}]`);
  if (event.type === 'generator.tests-ready') return console.log(`${tag}   Generator: ${event.payload.tests.length} tests, ${event.payload.validated}/${event.payload.total} selectors validated [${event.payload.strategy}]`);
  if (event.type === 'executor.results-ready') return console.log(`${tag}   Executor: ${event.payload.outcomes.filter((o) => o.status === 'passed').length} passed, ${event.payload.outcomes.filter((o) => o.status === 'failed').length} failed`);
  if (event.type === 'healer.interventions-ready') return console.log(`${tag}   Healer: ${event.payload.interventions.length} intervention(s) [${event.payload.strategy}]`);
  if (event.type === 'report.ready') return console.log(`${tag} ★ Report: ${event.payload.verdict} - ${event.payload.summary}`);
  if (event.type === 'run.complete') return console.log(`${tag} ✓ Mission complete`);
  if (event.type === 'run.failed') return console.error(`${tag} ✗ Mission failed: ${event.payload.message}`);
}

function loadLocalEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}
