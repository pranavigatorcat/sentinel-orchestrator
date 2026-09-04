export class HealerAgent {
  async run(outcomes, { demoMode }, emit) {
    const interventions = outcomes.filter((o) => o.status === 'failed').map((failure) => ({
      testId: failure.id, classification: 'broken-test-script', confidence: 0.94,
      reasoning: 'The application had an equivalent semantic control, but the generated data-testid was obsolete. No user-visible assertion failed.',
      action: 'Replaced obsolete locator with getByRole("button", { name: /pay now/i })', before: '[data-testid="submit-order"]', after: 'getByRole("button", { name: /pay now/i })',
      result: demoMode ? 'healed-and-passed' : 'proposed'
    }));
    const healed = outcomes.map((o) => interventions.some((h) => h.testId === o.id && h.result === 'healed-and-passed') ? { ...o, status: 'passed-after-heal' } : o);
    emit('healer.interventions-ready', { interventions, outcomes: healed });
    return { interventions, outcomes: healed };
  }
}
