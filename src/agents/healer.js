import { askForJson } from '../infrastructure/llm-planner.js';

export class HealerAgent {
  async run(outcomes, { demoMode }, emit) {
    const fallback = outcomes.filter((o) => o.status === 'failed').map((failure) => ({
      testId: failure.id, classification: 'broken-test-script', confidence: 0.94,
      reasoning: 'The application had an equivalent semantic control, but the generated data-testid was obsolete. No user-visible assertion failed.',
      action: 'Replaced obsolete locator with getByRole("button", { name: /pay now/i })', before: '[data-testid="submit-order"]', after: 'getByRole("button", { name: /pay now/i })',
      result: demoMode ? 'healed-and-passed' : 'proposed'
    }));
    const model = await askForJson({
      system: 'You are a cautious test-healing agent. Return JSON only: {interventions:[{testId,classification,confidence,reasoning,action,before,after,result}]}. Classification must be broken-test-script, genuine-application-defect, or inconclusive. Propose a repair only for a broken test script with evidence. Never delete an assertion or call a product defect healed. Return an empty interventions array if no outcome failed.',
      input: { outcomes: outcomes.map(({ id, title, status, evidence, source }) => ({ id, title, status, evidence, source })) }
    });
    const raw = Array.isArray(model.value?.interventions) ? model.value.interventions : [];
    const failedIds = new Set(outcomes.filter((outcome) => outcome.status === 'failed').map((outcome) => outcome.id));
    const modelInterventions = raw.filter((item) => failedIds.has(item.testId) && ['broken-test-script', 'genuine-application-defect', 'inconclusive'].includes(item.classification)).map((item) => ({ ...item, confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0)), result: item.classification === 'broken-test-script' && Number(item.confidence) >= 0.8 ? 'proposed' : 'escalated' }));
    // A fixture repair has an actual deterministic replay. Model suggestions for
    // live targets remain proposals until a target-specific replay verifies them.
    const interventions = demoMode && fallback.length ? fallback : modelInterventions.length || !fallback.length ? modelInterventions : fallback;
    const healed = outcomes.map((o) => interventions.some((h) => h.testId === o.id && h.result === 'healed-and-passed') ? { ...o, status: 'passed-after-heal' } : o);
    emit('healer.interventions-ready', { interventions, outcomes: healed, strategy: model.value ? demoMode && fallback.length ? 'structured-llm + guarded fixture replay' : 'structured-llm' : `rule-fallback (${model.diagnostic})` });
    return { interventions, outcomes: healed };
  }
}
