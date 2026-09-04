# Executor Agent - Usage Guide

**Source:** `src/agents/executor.js`  
**Stage:** Fourth  
**Role:** Turn generated tests into normalised outcomes and evidence.

## Current demo behaviour

Showcase mode is deterministic: three tests pass and one fails because its locator resolves to zero elements. Each result contains a duration and a human-readable evidence string. This is intentionally fast enough to rerun during a judge Q&A.

## Live target handoff

Live execution is deliberately marked `blocked` until a team member configures safe, target-specific actions and credentials. This is safer than clicking unknown production controls from a generic agent. To complete it during the hackathon:

1. Launch Chromium once with a clean context and the organiser-provided credentials.
2. Use the generated source and run one independent page/context per scenario.
3. Capture URL, screenshot, console errors, locator count, and assertion result as evidence.
4. Emit an `executor.results-ready` event with `passed`, `failed`, or `blocked` outcomes.
5. Run independent read-only scenarios concurrently only after the serial path works.

## Success criteria

An executor outcome must include `status`, duration, and evidence. A failure without evidence is not eligible for automatic healing; it is `inconclusive` and should be surfaced to the user.
