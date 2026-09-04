import { runSauceDemoSuite } from '../infrastructure/sauce-demo-runner.js';

export class ExecutorAgent {
  async run(tests, { demoMode, url }, emit) {
    // In live mode execution is intentionally surfaced as pending until credentials and target-specific data are configured.
    const outcomes = demoMode
      ? tests.map((test, index) => ({ ...test, status: test.execution, durationMs: test.execution === 'failed' ? 612 : 410 + index * 127, evidence: test.execution === 'failed' ? 'Locator [data-testid="submit-order"] resolved to 0 elements.' : 'Expected success state observed.' }))
      : isSauceDemo(url)
        ? await runSauceDemoSuite(url, tests)
        : tests.map((test) => ({ ...test, status: 'blocked', durationMs: 0, evidence: 'Live runner adapter is awaiting target credentials/configuration.' }));
    emit('executor.results-ready', { outcomes });
    return outcomes;
  }
}
function isSauceDemo(url) { try { return new URL(url).hostname === 'www.saucedemo.com'; } catch { return false; } }
