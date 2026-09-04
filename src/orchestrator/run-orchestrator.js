import { PlannerAgent } from '../agents/planner.js';
import { CoverageCriticAgent } from '../agents/coverage-critic.js';
import { GeneratorAgent } from '../agents/generator.js';
import { ExecutorAgent } from '../agents/executor.js';
import { HealerAgent } from '../agents/healer.js';

export class RunOrchestrator {
  constructor(input, publish) { this.input = input; this.publish = publish; }
  emit(type, payload) { this.publish({ type, payload, at: new Date().toISOString() }); }
  async stage(name, work) { this.emit('stage.started', { name }); const value = await work(); this.emit('stage.completed', { name }); return value; }
  async run() {
    this.emit('run.started', { input: { ...this.input, prd: this.input.prd ? '[provided]' : '' } });
    const planner = new PlannerAgent(); const critic = new CoverageCriticAgent(); const generator = new GeneratorAgent(); const executor = new ExecutorAgent(); const healer = new HealerAgent();
    const plan = await this.stage('Planner: explore and model user flows', () => planner.run(this.input, (type, payload) => this.emit(type, payload)));
    const coverage = await this.stage('Coverage critic: challenge the plan', () => critic.run(plan, this.input, (type, payload) => this.emit(type, payload)));
    const tests = await this.stage('Generator: create and validate tests', () => generator.run(plan, this.input, (type, payload) => this.emit(type, payload)));
    const results = await this.stage('Executor: run generated suite', () => executor.run(tests, this.input, (type, payload) => this.emit(type, payload)));
    const healing = await this.stage('Healer: diagnose and repair failures', () => healer.run(results, this.input, (type, payload) => this.emit(type, payload)));
    const report = reportFor(plan, coverage, healing);
    this.emit('report.ready', report);
    return { plan, coverage, tests, results: healing.outcomes, healing: healing.interventions, report };
  }
}
function reportFor(plan, coverage, healing) {
  const passed = healing.outcomes.filter((o) => o.status.startsWith('passed')).length;
  return { verdict: healing.outcomes.every((o) => o.status.startsWith('passed')) ? 'Ready for review' : 'Needs investigation', scenariosCovered: plan.scenarios.length, passed, healed: healing.interventions.length, coverageScore: coverage.score, remainingRisk: coverage.gaps.filter((g) => g.severity !== 'info'), summary: `${passed}/${plan.scenarios.length} generated tests passed; ${healing.interventions.length} selector issue was classified and handled.` };
}
