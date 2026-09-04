import { CoverageReview } from '../domain/schemas.js';
import { askForJson } from '../infrastructure/llm-planner.js';

export class CoverageCriticAgent {
  async run(plan, { prd = '' }, emit) {
    const fallback = heuristicReview(plan, prd);
    const model = await askForJson({
      system: 'You are a demanding software-test coverage critic. Return JSON only: score (0-100), gaps ([{severity: high|medium|low|info, area, recommendation}]), uncoveredRequirements (string array), decision (string). Assess meaningful flow, negative-path, recovery, accessibility, and optional PRD coverage. Do not claim a flow is covered without evidence in the plan.',
      input: { plan, prd: prd || 'No PRD provided.' }
    });
    const parsed = CoverageReview.safeParse(model.value);
    const review = parsed.success ? parsed.data : fallback;
    review.strategy = parsed.success ? 'structured-llm' : `deterministic-fallback (${model.diagnostic})`;
    emit('critic.coverage-reviewed', review);
    return review;
  }
}
function heuristicReview(plan, prd) {
    const tags = new Set(plan.scenarios.flatMap((s) => s.tags));
    const gaps = [];
    if (!tags.has('authentication')) gaps.push({ severity: 'medium', area: 'Authentication', recommendation: 'Add sign-in, rejected credentials, and session-expiry coverage if authentication exists.' });
    if (!tags.has('accessibility')) gaps.push({ severity: 'low', area: 'Accessible feedback', recommendation: 'Verify errors are visible to keyboard and assistive-technology users.' });
    if (!prd.trim()) gaps.push({ severity: 'info', area: 'Requirement traceability', recommendation: 'No PRD supplied; requirement-to-test traceability is unavailable.' });
    const requirements = extractRequirements(prd);
    const uncoveredRequirements = requirements.filter((r) => !plan.scenarios.some((s) => normalize(s.title + s.steps.join(' ')).includes(normalize(r).slice(0, 16))));
  return { score: Math.max(55, 92 - gaps.filter((g) => g.severity !== 'info').length * 12), gaps, uncoveredRequirements, decision: 'proceed-with-explicit-risk' };
}
function extractRequirements(prd) { return prd.split(/\n|(?<=[.!?])\s+/).map((x) => x.trim()).filter((x) => /must|should|shall|users?|system/i.test(x) && x.length > 18).slice(0, 12); }
function normalize(value) { return value.toLowerCase().replace(/[^a-z0-9 ]/g, ''); }
