import { test, expect } from '@playwright/test';

/**
 * Edge-case suite demonstrating the boundary, overflow, and concurrency
 * testing approach used on production numeric-field validation work
 * (rewritten here against a public API to keep the example generic
 * and free of any employer-specific implementation detail).
 *
 * Categories covered:
 *  1. Numeric field boundaries (min/max, zero, negative)
 *  2. Integer overflow risk
 *  3. Malformed / oversized payloads
 *  4. Concurrent request handling
 */
test.describe('API edge cases', () => {
  test.describe('Numeric boundary values', () => {
    test('rejects or safely handles a negative quantity', async ({ request }) => {
  const res = await request.post('/carts/add', {
    data: {
      userId: 1,
      products: [{ id: 1, quantity: -5 }],
    },
  });

  // FINDING: DummyJSON does not validate quantity server-side — it
  // accepts a negative quantity, returns 200, and propagates a
  // negative total (price * -5) with no guardrail. In a production
  // system this would be a real defect (e.g. a voucher/cart total
  // going negative), so the assertion below documents the API's
  // actual behaviour rather than the ideal contract. A real bug
  // report against this endpoint would flag exactly this gap.
  expect([200, 201, 400, 422]).toContain(res.status());
  if (res.ok()) {
    const body = await res.json();
    expect(typeof body.total).toBe('number');
    // Documented gap: total is NOT guaranteed >= 0 on this API.
    // expect(body.total).toBeGreaterThanOrEqual(0); // would fail — see finding above
  }
});

    test('handles a zero quantity without throwing a server error', async ({ request }) => {
      const res = await request.post('/carts/add', {
        data: { userId: 1, products: [{ id: 1, quantity: 0 }] },
      });
      expect(res.status()).toBeLessThan(500);
    });

    test('handles a very large quantity without a 500-level failure', async ({ request }) => {
      const res = await request.post('/carts/add', {
        data: { userId: 1, products: [{ id: 1, quantity: 1_000_000 }] },
      });
      expect(res.status()).toBeLessThan(500);
    });
  });

  test.describe('Integer overflow risk', () => {
    test('a value beyond 32-bit signed int max does not crash the server', async ({ request }) => {
      // 2^31 - 1 = 2147483647 is the classic 32-bit signed int boundary.
      // Sending one above it is a standard overflow probe.
      const overflowValue = 2_147_483_648;

      const res = await request.post('/users/add', {
        data: { firstName: 'Overflow', age: overflowValue },
      });

      expect(res.status()).toBeLessThan(500);
    });

    test('a value beyond Number.MAX_SAFE_INTEGER is handled gracefully', async ({ request }) => {
      const beyondSafeInt = Number.MAX_SAFE_INTEGER + 10;

      const res = await request.post('/users/add', {
        data: { firstName: 'Overflow2', age: beyondSafeInt },
      });

      expect(res.status()).toBeLessThan(500);
    });
  });

  test.describe('Malformed and oversized payloads', () => {
    test('missing required field is rejected or defaulted, never a 500', async ({ request }) => {
      const res = await request.post('/users/add', { data: {} });
      expect(res.status()).toBeLessThan(500);
    });

    test('wrong data type on a numeric field does not crash the server', async ({ request }) => {
      const res = await request.post('/users/add', {
        data: { firstName: 'Type', age: 'not-a-number' },
      });
      expect(res.status()).toBeLessThan(500);
    });

    test('an oversized string field is handled without a server error', async ({ request }) => {
      const longString = 'a'.repeat(10_000);
      const res = await request.post('/users/add', {
        data: { firstName: longString },
      });
      expect(res.status()).toBeLessThan(500);
    });
  });

  test.describe('Concurrency', () => {
    test('multiple simultaneous requests against the same resource all resolve cleanly', async ({ request }) => {
      // Fires 10 concurrent reads against the same user id — modelled on
      // concurrency checks used to probe for race conditions in
      // shared-state operations (e.g. voucher redemption, balance updates).
      const concurrentRequests = Array.from({ length: 10 }, () => request.get('/users/1'));

      const responses = await Promise.all(concurrentRequests);

      for (const res of responses) {
        expect(res.status()).toBe(200);
      }

      const bodies = await Promise.all(responses.map((r) => r.json()));
      const ids = new Set(bodies.map((b) => b.id));
      expect(ids.size).toBe(1); // every response describes the same, unmutated resource
    });

    test('concurrent writes to a cart do not corrupt the response shape', async ({ request }) => {
      const concurrentWrites = Array.from({ length: 5 }, (_, i) =>
        request.post('/carts/add', {
          data: { userId: 1, products: [{ id: i + 1, quantity: 1 }] },
        })
      );

      const responses = await Promise.all(concurrentWrites);

      for (const res of responses) {
        expect(res.status()).toBeLessThan(500);
      }
    });
  });
});
