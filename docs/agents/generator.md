# Generator Agent - Usage Guide

**Source:** `src/agents/generator.js`  
**Stage:** Third  
**Role:** Convert reviewed scenarios into an executable, inspectable Playwright test representation.

## Output contract

For each scenario the Generator asks the configured LLM for Playwright source, then validates that exactly one structurally valid test maps to every approved scenario. It returns an id, originating scenario id, title, selector status, generated source text, and initial execution state. It emits `generator.tests-ready` with validation counts and its strategy.

The generated source uses Playwright conventions: `page.goto`, semantic/attribute locators, action, and assertion. It is an agent-produced artefact; no manually authored end-test fixture is used in the pipeline.

## Demo fixture

`T-03` deliberately references an obsolete `data-testid`. This is a controlled signal for the Healer and makes the repair path observable in every presentation.

## Target integration

Pass observed controls from Planner metadata and prefer selectors in this order: `data-testid`, role plus accessible name, label, then name. Before accepting a source file, resolve each locator against the live DOM and reject locators matching zero or multiple unintended elements. Write accepted sources under a per-run artefact directory only after the team agrees on data retention.

## Do not do

Do not ask a model to produce unrestricted shell commands. Do not accept a generated selector without validation. Do not change an expected product outcome merely to turn a failing test green.
