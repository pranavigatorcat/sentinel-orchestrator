# Planner Agent - Usage Guide

**Source:** `src/agents/planner.js`  
**Stage:** First  
**Role:** Explore the URL and propose a readable, risk-prioritised plan before any test code exists.

## Inputs

- `url` (required): the target web application.
- `intent` (optional): a developer focus such as “checkout and authentication.”
- `demoMode`: chooses the deterministic checkout observation or the browser adapter.

## Output

Returns a validated `TestPlan`: application name, visible assumptions, scenarios, risk levels, scenario type, steps, expected outcome, and tags. It emits `planner.plan-ready` containing the observation and plan.

## Current behaviour

The plan always has four evidence-oriented fallback flows: success, invalid input, recovery from failure, and navigation/context. This guards against the shallow “only happy path” output common in generated testing. In showcase mode it uses a known checkout fixture so the presentation is stable. In live mode `browser-explorer.js` captures title, links, and controls. The provider boundary supports an OpenCode Go key (`OPENCODE_GO_API_KEY`, default model `kimi-k2.7-code`), general OpenCode inference key (`OPENCODE_API_KEY`, default `kimi-k2.5`), direct OpenAI key (`OPENAI_API_KEY`, default `gpt-4.1-mini`), or generic compatible provider (`LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`). OpenCode Go calls are identified with a per-request `x-opencode-session` header. Invalid or unavailable model responses fall back safely and print a non-sensitive reason in the terminal; API keys and request contents are never logged.

## Modify for the official target

Add target-specific intents only after observing the target. Keep an authentication scenario conditional: do not invent a login flow if the site has none. If adding an LLM, ask it for the `TestPlan` structure only, parse it with `TestPlan.parse`, and retain the planner's visible assumptions.

## Failure handling

If browser launch or navigation fails, the explorer returns a conservative “Uninspected target” observation rather than throwing. The Planner still produces a limited plan and marks the assumption so the Critic can expose the risk.
