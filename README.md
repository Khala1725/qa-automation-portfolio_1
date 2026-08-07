# QA Automation Portfolio

A framework demonstrating end-to-end UI testing, API testing (including boundary/overflow/concurrency edge cases), and CI/CD integration — built with **Playwright**, **TypeScript**, and both **GitHub Actions** and **Azure Pipelines**.

This project is a generic, public-site rebuild of testing patterns used in production work: numeric-field boundary and concurrency testing on a voucher/payments system, Page Object Model structure for large UI suites, and pipeline-integrated reporting.

## What's covered

| Layer | Target | What it demonstrates |
|---|---|---|
| E2E UI | [Sauce Demo](https://www.saucedemo.com) | Page Object Model, auth (positive + negative paths), cart/checkout flow, sort/filter validation |
| API | [DummyJSON](https://dummyjson.com) | Baseline CRUD coverage, numeric boundary values, integer overflow probes, malformed/oversized payloads, concurrent request handling |
| CI/CD | GitHub Actions + Azure Pipelines | Automated run on every push, HTML report published as a pipeline artifact |

## Why the edge-case suite exists

`api/tests/edge-cases.api.spec.ts` is the most deliberate part of this repo. It's modelled on real edge-case testing done against a production voucher system, covering:
- Numeric boundaries (negative, zero, very large values)
- Integer overflow (32-bit signed int max, `Number.MAX_SAFE_INTEGER`)
- Malformed payloads (missing fields, wrong types, oversized strings)
- Concurrency (parallel reads/writes against the same resource, checking for race conditions)

The assertions are written against what the *contract should guarantee* (no 500s, no negative totals, consistent resource state under concurrent access) rather than assuming the public mock API enforces this — the comments in the file explain that distinction.

## Project structure

```
qa-automation-portfolio/
├── e2e/
│   ├── pages/        # Page Object Model
│   ├── tests/         # auth.spec.ts, checkout.spec.ts
│   └── fixtures/
├── api/
│   └── tests/          # users.api.spec.ts, edge-cases.api.spec.ts
├── .github/workflows/ci.yml
├── azure-pipelines.yml
└── playwright.config.ts
```

## Running locally

```bash
npm install
npx playwright install --with-deps

npm run test:e2e     # UI suite only
npm run test:api     # API suite only
npm run test:all     # everything

npm run report       # open the last HTML report
```

## Tech stack

- **Playwright** + **TypeScript**
- Page Object Model architecture
- GitHub Actions & Azure Pipelines (both included — the latter reflects real professional CI/CD experience)
- HTML reporting published as a build artifact

## Background

Built by a QA automation engineer with production experience across insurance and gaming domains, working across Playwright, Maestro (mobile), Postman/API testing, and Azure DevOps pipelines.
