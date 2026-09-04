import { TestPlan } from '../domain/schemas.js';
import { explore } from '../infrastructure/browser-explorer.js';
import { askForPlan } from '../infrastructure/llm-planner.js';

export class PlannerAgent {
  async run({ url, intent, demoMode }, emit) {
    const observation = demoMode ? demoObservation(url) : await explore(url, (type, payload) => emit(type, payload));
    const noun = observation.title === 'Uninspected target' ? 'primary workflow' : observation.title;
    const baseline = {
      application: observation.title, assumptions: [
        observation.live ? 'Live DOM exploration completed; selectors are provisional until generation.' : 'Browser snapshot unavailable; plan is intentionally conservative.',
        intent ? `Developer focus: ${intent}` : 'No focus was supplied; prioritising entry, mutation, validation, and recovery paths.'
      ],
      scenarios: [
        scenario('SC-01', `Enter ${noun} successfully`, 'critical', 'happy-path', ['Open the entry route', 'Supply valid data', 'Submit the primary action'], 'The user reaches the expected success state.', ['core', 'smoke']),
        scenario('SC-02', 'Reject incomplete or invalid submission', 'high', 'negative', ['Open the primary form', 'Leave a required field empty or enter malformed data', 'Submit'], 'An explicit validation message is shown and no unintended action occurs.', ['validation', 'negative']),
        scenario('SC-03', 'Recover from an unavailable or failed action', 'high', 'edge', ['Trigger the primary action', 'Simulate a delayed or failed response', 'Retry or return safely'], 'Failure is comprehensible and the user can recover without data loss.', ['resilience', 'edge']),
        scenario('SC-04', 'Navigate without losing user context', 'medium', 'edge', ['Begin a user task', 'Use a navigation control', 'Return to the task'], 'Navigation is usable and expected state is preserved or explained.', ['navigation', 'edge'])
      ], coverageNotes: ['Every plan includes a happy path, a validation path, and a recovery path to prevent shallow coverage.']
    };
    const plan = demoMode ? baseline : (await askForPlan({ observation, intent }) ?? baseline);
    emit('planner.plan-ready', { observation, plan, strategy: plan === baseline ? 'structured-fallback' : 'structured-llm' });
    return TestPlan.parse(plan);
  }
}
function scenario(id, title, risk, type, steps, expected, tags) { return { id, title, risk, type, steps, expected, tags }; }
function demoObservation(url) { return { title: 'Acme Checkout Demo', url, live: true, links: [{ text: 'Cart' }, { text: 'Account' }], controls: [{ text: 'Email', selector: '[data-testid="email"]' }, { text: 'Pay now', selector: '[data-testid="checkout-submit"]' }] }; }
