import express from 'express';
import { EventEmitter } from 'node:events';
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
  const run = { id: crypto.randomUUID(), events: new EventEmitter(), state: 'queued', result: null };
  runs.set(run.id, run);
  res.status(202).json({ id: run.id });
  queueMicrotask(async () => {
    try {
      run.state = 'running';
      run.result = await new RunOrchestrator(parsed.data, (event) => run.events.emit('event', event)).run();
      run.state = 'complete';
      run.events.emit('event', { type: 'run.complete', payload: run.result });
    } catch (error) {
      run.state = 'failed';
      run.events.emit('event', { type: 'run.failed', payload: { message: error.message } });
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
  if (run.result) send({ type: 'run.complete', payload: run.result });
  req.on('close', () => run.events.off('event', listener));
});

app.get('/{*splat}', (_req, res) => res.sendFile(path.join(root, 'web', 'index.html')));
const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`Sentinel workbench: http://localhost:${port}`));

function loadLocalEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}
