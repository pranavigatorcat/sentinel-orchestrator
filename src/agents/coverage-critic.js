export class CoverageCriticAgent {
  run(plan, { prd = '' }, emit) {
    const tags = new Set(plan.scenarios.flatMap((s) => s.tags));
    const gaps = [];
    if (!tags.has('authentication')) gaps.push({ severity: 'medium', area: 'Authentication', recommendation: 'Add sign-in, rejected credentials, and session-expiry coverage if authentication exists.' });
    if (!tags.has('accessibility')) gaps.push({ severity: 'low', area: 'Accessible feedback', recommendation: 'Verify errors are visible to keyboard and assistive-technology users.' });
    if (!prd.trim()) gaps.push({ severity: 'info', area: 'Requirement traceability', recommendation: 'No PRD supplied; requirement-to-test traceability is unavailable.' });
    const requirements = extractRequirements(prd);
    const uncoveredRequirements = requirements.filter((r) => !plan.scenarios.some((s) => normalize(s.title + s.steps.join(' ')).includes(normalize(r).slice(0, 16))));
    const review = { score: Math.max(55, 92 - gaps.filter((g) => g.severity !== 'info').length * 12), gaps, uncoveredRequirements, decision: 'proceed-with-explicit-risk' };
    emit('critic.coverage-reviewed', review);
    return review;
  }
}
function extractRequirements(prd) { return prd.split(/\n|(?<=[.!?])\s+/).map((x) => x.trim()).filter((x) => /must|should|shall|users?|system/i.test(x) && x.length > 18).slice(0, 12); }
function normalize(value) { return value.toLowerCase().replace(/[^a-z0-9 ]/g, ''); }
