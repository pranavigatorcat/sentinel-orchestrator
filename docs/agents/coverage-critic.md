# Coverage Critic Agent - Usage Guide

**Source:** `src/agents/coverage-critic.js`  
**Stage:** Second  
**Role:** Challenge the Planner before the system invests in code generation.

## Inputs and output

It consumes a `TestPlan` and optional PRD text. It returns a coverage score, gap objects (`severity`, `area`, `recommendation`), requirement statements that are not clearly represented in the plan, and a decision. It emits `critic.coverage-reviewed`.

## Judgement rules

- Missing authentication coverage becomes an explicit medium risk, not an invented test.
- Missing accessibility feedback becomes a low risk.
- Without a PRD, traceability is called out instead of pretending it exists.
- PRD sentences containing terms like “must”, “should”, “shall”, “user”, or “system” are candidates for gap comparison.

## How to improve it

Replace keyword extraction with structured PRD requirements and trace each requirement to scenario IDs. A high-quality on-field enhancement is to render a matrix: requirement → generated test → evidence → remaining risk. Never suppress a gap just to improve the score; the report is more credible when it admits its boundaries.
