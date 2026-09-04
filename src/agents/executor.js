export class ExecutorAgent {
  async run(tests, { demoMode }, emit) {
    // In live mode execution is intentionally surfaced as pending until credentials and target-specific data are configured.
    const outcomes = tests.map((test, index) => demoMode ? ({ ...test, status: test.execution, durationMs: test.execution === 'failed' ? 612 : 410 + index * 127, evidence: test.execution === 'failed' ? 'Locator [data-testid="submit-order"] resolved to 0 elements.' : 'Expected success state observed.' }) : ({ ...test, status: 'blocked', durationMs: 0, evidence: 'Live runner adapter is awaiting target credentials/configuration.' }));
    emit('executor.results-ready', { outcomes });
    return outcomes;
  }
}
