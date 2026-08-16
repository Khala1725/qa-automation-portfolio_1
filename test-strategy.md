# Test Strategy

## Approach

This project uses a risk-based approach rather than aiming for exhaustive coverage. The goal is to demonstrate *how* I decide what to test and why, not just to accumulate a large test count.

Three layers are covered, each chosen because it exercises a different kind of risk:

| Layer | Risk being tested |
|---|---|
| E2E (UI) | User-facing flows breaking silently — login, cart, checkout |
| API — baseline | Contract correctness — status codes, schema shape, pagination |
| API — edge cases | Boundary, overflow, and concurrency failures that don't show up in happy-path testing but cause real production incidents |

## Why the edge-case suite is prioritized

In production systems handling money or inventory (e.g. a voucher or payments system), the most damaging bugs are rarely in the happy path — they're in the boundaries: what happens at zero, at the numeric ceiling, under concurrent access, with malformed input. Happy-path tests catch regressions; boundary tests catch the incidents that end up in a post-mortem.

The categories chosen for this suite (`api/tests/edge-cases.api.spec.ts`) map directly to failure modes I've seen matter in practice:

- **Numeric boundaries** (negative, zero, very large) — catches missing input validation before it reaches business logic
- **Integer overflow** (32-bit signed int max, `Number.MAX_SAFE_INTEGER`) — catches type coercion bugs that only appear at specific numeric thresholds
- **Malformed/oversized payloads** — catches unhandled exceptions from client input the frontend "shouldn't" send but sometimes does
- **Concurrency** — catches race conditions in shared-state operations (e.g. two requests redeeming the same voucher, or updating the same balance, at once)

## Finding: DummyJSON does not validate cart quantity server-side

While building the negative-quantity boundary test, the suite surfaced a real behavioural gap in the target API rather than a bug in the test itself.

**Test:** `POST /carts/add` with `quantity: -5`
**Expected (if this were a production system):** rejection (4xx), or a computed total that cannot go negative
**Actual:** `200 OK`, with `total` computed as `price × -5`, i.e. a negative total returned with no server-side guard

**Why this matters:** in a real cart, voucher, or billing system, an unvalidated negative quantity is a genuine defect class — it can be used to manipulate totals, generate negative balances, or bypass minimum-order logic. This is exactly the kind of finding that boundary testing is designed to surface, and exactly the kind of finding that's easy to miss if testing only covers realistic, well-formed input.

**How I handled it:** rather than deleting or forcing the test to pass, I adjusted the assertion to document the API's actual behaviour and left a commented-out line showing what the *correct* assertion would be if this were a system I could raise a defect against. In a real sprint, this would become a bug ticket with the request/response pair attached as evidence, not a silently adjusted test.

## What I'd add with more time

- **Property-based / fuzzed input testing** on the numeric fields, rather than a fixed list of boundary values, to surface additional gaps beyond the ones chosen manually
- **Rate-limit and throttling tests** — not covered here since DummyJSON has no rate limiting to test against
- **Contract testing** (e.g. against an OpenAPI spec) to catch schema drift automatically rather than relying on manual `toHaveProperty` assertions
- **Visual regression testing** on the E2E suite, to catch unintended UI changes that functional assertions alone wouldn't flag
- **Accessibility checks** (e.g. axe-core integration) on the Sauce Demo flows, since accessibility is often deprioritized under release pressure the same way edge-case testing is
