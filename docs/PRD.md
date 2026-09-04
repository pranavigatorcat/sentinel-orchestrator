# Sentinel Product Requirements Document

## Product intent

Sentinel reduces the coordination burden of modern web testing. A developer supplies a URL, optionally adds product intent and product requirements, and receives a meaningful, explainable test-quality signal without manually sequencing planning, generation, execution, or repair.

## Primary users

- A developer who needs quick confidence before sharing a change.
- A QA engineer who wants an auditable starting suite, not opaque AI output.
- A hackathon judge who must understand agent decisions in one live run.

## Must-have requirements and acceptance criteria

| Requirement from brief | Sentinel behaviour | Acceptance evidence |
| --- | --- | --- |
| URL is the only required input | Form requires exactly one valid URL | Empty/malformed URLs are rejected before a run exists |
| Planner explores and makes readable plan | Planner emits named, risk-tagged scenarios and expected outcomes | Test plan panel shows happy, negative, and edge flows |
| Coverage is evaluated before generation | Critic emits score, gaps, and proceeding rationale | Event feed shows critic before generator stage |
| Generator validates test shape/selectors | Generator returns source and selector status | Generated suite panel shows each status |
| Execute, diagnose, and heal failures | Executor returns evidence; healer classifies and proposes/replays repair | Showcase run heals one stale locator with confidence |
| Final quality report | Report synthesises outcomes, healer actions, remaining risk | Quality report displays score, pass count, healing count, and risk |

## Good-to-have and bonus design

Intent is accepted as a plain-language focus string and preserved as a Planner assumption. Pasting PRD text enables a lightweight requirement-gap pass. Parallel execution is a future executor strategy because a demo suite is too small for its cost to be visible. The healer includes a typed distinction between `broken-test-script` and `genuine-application-defect`; the showcased locator repair proves the first path.

## Non-goals

No deployment, CI integration, cross-browser coverage, account storage, broad production crawling, or claim of exhaustive coverage. The system is designed to communicate remaining risk, not hide it behind a single pass/fail label.

## Demo success metric

In under 90 seconds a naive observer should be able to answer: What did Sentinel test? What did it intentionally not test? Why did a failure occur? What did the healer change? Is the product ready for a human to review?

## Upgrade path

1. Replace the baseline planner with structured LLM output, validated through `TestPlan`.
2. Pass live DOM metadata from the planner to the generator and execute generated Playwright tests in an isolated browser context.
3. Store run artefacts (test source, traces, screenshots) in a run directory.
4. Use replay evidence plus network/console signals for stronger defect classification.
