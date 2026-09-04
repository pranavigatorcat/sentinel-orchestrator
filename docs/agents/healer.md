# Healer Agent - Usage Guide

**Source:** `src/agents/healer.js`  
**Stage:** Fifth  
**Role:** Replay and classify failures, repairing only automation defects with strong evidence.

## Inputs and output

The Healer consumes normalised execution outcomes. For every repair it returns a test id, classification, confidence, reasoning, before/after selectors, action, and result. It emits `healer.interventions-ready`.

## Classification policy

Classify as `broken-test-script` only when the old locator is invalid and an equivalent semantic control supports the original user intent. Classify as `genuine-application-defect` when the test reaches the expected control but observed product behaviour violates a requirement. Use `inconclusive` for network, login, fixture, or environment faults.

## Demonstrated repair

The fixture changes `[data-testid="submit-order"]` to `getByRole("button", { name: /pay now/i })`. The latter reflects a semantic user-facing control, so it is more resilient to test-id drift. The original assertion remains unchanged.

## Guardrails

Never heal by deleting assertions, extending timeouts without evidence, or replacing an error expectation with success. Always preserve before/after data and require a replay before declaring `healed-and-passed`. Escalate low-confidence classifications rather than guessing.
