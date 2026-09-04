export class GeneratorAgent {
  async run(plan, { demoMode }, emit) {
    const tests = plan.scenarios.map((scenario, index) => ({
      id: `T-${String(index + 1).padStart(2, '0')}`, scenarioId: scenario.id, title: scenario.title,
      selectorStatus: index === 2 ? 'stale-selector' : 'validated',
      source: makeTest(scenario, index === 2), execution: demoMode ? (index === 2 ? 'failed' : 'passed') : 'queued'
    }));
    emit('generator.tests-ready', { tests, validated: tests.filter((t) => t.selectorStatus === 'validated').length, total: tests.length });
    return tests;
  }
}
function makeTest(scenario, stale) {
  const selector = stale ? '[data-testid="submit-order"]' : '[data-testid="checkout-submit"]';
  return `test('${scenario.title}', async ({ page }) => {\n  await page.goto(process.env.TARGET_URL);\n  await page.locator('${selector}').click();\n  await expect(page).toHaveURL(/success|confirmation/);\n});`;
}
