import { GeneratedTest } from '../domain/schemas.js';
import { askForJson } from '../infrastructure/llm-planner.js';

export class GeneratorAgent {
  async run(plan, { demoMode }, emit) {
    const fallback = plan.scenarios.map((scenario, index) => ({
      id: `T-${String(index + 1).padStart(2, '0')}`, scenarioId: scenario.id, title: scenario.title,
      selectorStatus: index === 2 ? 'stale-selector' : 'validated',
      source: makeTest(scenario, index === 2), execution: demoMode ? (index === 2 ? 'failed' : 'passed') : 'queued'
    }));
    const model = await askForJson({
      system: 'You are a Playwright test generator. Return JSON only: {tests:[{scenarioId,title,source,selectors}]}. Create exactly one executable TypeScript Playwright test per supplied scenario. Use semantic, label, or data-testid selectors only when supported by the observation. Do not weaken assertions or invent controls. Source must be plain code, no markdown.',
      input: { plan }
    });
    const generated = Array.isArray(model.value?.tests) ? model.value.tests.map((test) => GeneratedTest.safeParse(test)).filter((result) => result.success).map((result) => result.data) : [];
    const validGenerated = generated.length === plan.scenarios.length && new Set(generated.map((test) => test.scenarioId)).size === plan.scenarios.length;
    const tests = validGenerated
      ? generated.map((test, index) => ({ id: `T-${String(index + 1).padStart(2, '0')}`, ...test, selectorStatus: 'llm-generated', execution: demoMode ? (index === 2 ? 'failed' : 'passed') : 'queued' }))
      : fallback;
    emit('generator.tests-ready', { tests, validated: tests.filter((t) => t.selectorStatus !== 'stale-selector').length, total: tests.length, strategy: validGenerated ? 'structured-llm' : `template-fallback (${model.diagnostic})` });
    return tests;
  }
}
function makeTest(scenario, stale) {
  const selector = stale ? '[data-testid="submit-order"]' : '[data-testid="checkout-submit"]';
  return `test('${scenario.title}', async ({ page }) => {\n  await page.goto(process.env.TARGET_URL);\n  await page.locator('${selector}').click();\n  await expect(page).toHaveURL(/success|confirmation/);\n});`;
}
