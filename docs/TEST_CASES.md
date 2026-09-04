# Test Cases and Demo Runbook

## Quick checks - run these before every demo

| ID | Command / action | Expected result | Duration |
| --- | --- | --- | --- |
| Q-01 | `npm test` | Two contract assertions pass | <1 second |
| Q-02 | `npm run dev` then open localhost | Sentinel landing page renders | <5 seconds |
| Q-03 | Launch default Showcase mode | Five stages complete; report says Ready for review | <2 seconds |
| Q-04 | Inspect healing ledger | `T-03` says broken-test-script, 94% confidence, and healed-and-passed | <2 seconds |
| Q-05 | Replace URL with `not-a-url` and submit | Clear input validation is displayed | <2 seconds |

## Functional test matrix

| ID | Scenario | Setup | Expected result |
| --- | --- | --- | --- |
| F-01 | Sole URL input | Leave optional fields blank | Run starts and Planner emits four meaningful flows |
| F-02 | Natural-language focus | Add “focus on checkout and authentication” | Planner assumptions display the focus |
| F-03 | Optional PRD | Paste a requirement with “must” | Critic emits PRD-aware gap analysis rather than no-PRD note |
| F-04 | Coverage challenge | Use any normal run | Critic appears before Generator and retains explicit risks |
| F-05 | Happy-path generation | Showcase mode | Test `T-01` succeeds with a selector status |
| F-06 | Negative-path plan | Showcase mode | Plan contains invalid/incomplete submission scenario |
| F-07 | Edge/recovery plan | Showcase mode | Plan contains unavailable/failed-action recovery scenario |
| F-08 | Broken-script healing | Showcase mode | Stale `submit-order` locator is replaced by semantic button locator |
| F-09 | Report integrity | Showcase mode | 4 scenarios, 4 passing outcomes after healing, 1 healed action |
| F-10 | Live exploration fallback | Disable showcase without browser installed | UI remains responsive and reports conservative/live limitations rather than crashing |

## On-field target testing checklist

1. Create disposable test data and get permission for any mutating flow.
2. Identify one core success path, one validation message, and one recoverable failure.
3. Record stable `data-testid`, role, and accessible-name selectors.
4. Implement only those three in `ExecutorAgent` first; do not broaden scope while the must-have run is unstable.
5. Deliberately change one selector in a fixture to prove the Healer.
6. Save a screenshot or screen recording of the decision feed as backup evidence.

## Presentation script (about 150 seconds)

Open with the URL-only promise (15s). Launch the deterministic mission (15s). Point to Planner scenarios and explicit Coverage Critic gaps (35s). Show the generated suite and stale selector failure (25s). Explain why the Healer calls it a broken script rather than masking an app defect, and show its replacement locator (35s). Close on the report's remaining risk and clear production boundaries (25s).
