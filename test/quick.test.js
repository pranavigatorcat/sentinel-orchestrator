import test from 'node:test';
import assert from 'node:assert/strict';
import { RunOrchestrator } from '../src/orchestrator/run-orchestrator.js';
import { StartRun } from '../src/domain/schemas.js';

const input = { url: 'https://checkout.acme.test', intent: 'focus on checkout', prd: 'Users must receive clear validation errors.', demoMode: true };

test('quick demo pipeline completes with transparent healing', async () => {
  const events = [];
  const result = await new RunOrchestrator(input, (event) => events.push(event)).run();
  assert.equal(result.plan.scenarios.length, 4);
  assert.equal(result.tests.length, 4);
  assert.equal(result.healing.length, 1);
  assert.equal(result.healing[0].classification, 'broken-test-script');
  assert.equal(result.results.filter((r) => r.status.startsWith('passed')).length, 4);
  assert.equal(result.report.verdict, 'Ready for review');
  assert.ok(events.some((e) => e.type === 'critic.coverage-reviewed'));
});

test('input contract rejects ambiguous target URLs', () => {
  assert.equal(StartRun.safeParse({ ...input, url: 'checkout.local' }).success, false);
  assert.equal(StartRun.safeParse(input).success, true);
});
