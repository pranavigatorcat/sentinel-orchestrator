# Sentinel Agent Guides

Each agent is a small module with one job, a typed return value, and no hidden calls to other agents. The orchestrator controls ordering and is the only component permitted to advance a run.

| Agent | Source | Purpose |
| --- | --- | --- |
| [Planner](planner.md) | `src/agents/planner.js` | Turn observation and intent into human-readable scenarios |
| [Coverage Critic](coverage-critic.md) | `src/agents/coverage-critic.js` | Identify untested risk before generation |
| [Generator](generator.md) | `src/agents/generator.js` | Turn approved scenarios into executable source and selector status |
| [Executor](executor.md) | `src/agents/executor.js` | Produce execution evidence and outcomes |
| [Healer](healer.md) | `src/agents/healer.js` | Classify failures and repair only test-script defects |

## Safe modification rule

Keep agent output JSON-like and deterministic at its boundary. If an LLM is introduced, validate its response with the domain schema before returning it, include the model decision in the event feed, and preserve an offline fixture for the demo.

## Event convention

An agent receives an `emit(type, payload)` callback. Its event should describe a decision a judge can understand, not raw prompt text or credentials. The orchestrator adds timestamps and sends events through Server-Sent Events to the UI.
