import { test, expect } from '@playwright/test';

/**
 * Baseline API coverage against DummyJSON's /users endpoint:
 * status codes, schema shape, and pagination behaviour.
 * Edge-case / boundary testing lives in edge-cases.api.spec.ts.
 */
test.describe('Users API - baseline', () => {
  test('GET /users returns a paginated list with expected shape', async ({ request }) => {
    const res = await request.get('/users?limit=10');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.users)).toBeTruthy();
    expect(body.users.length).toBeLessThanOrEqual(10);
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('skip');
    expect(body).toHaveProperty('limit', 10);

    for (const user of body.users) {
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(typeof user.email).toBe('string');
    }
  });

  test('GET /users/:id returns a single user', async ({ request }) => {
    const res = await request.get('/users/1');
    expect(res.status()).toBe(200);

    const user = await res.json();
    expect(user.id).toBe(1);
  });

  test('GET /users/:id with a non-existent id returns 404', async ({ request }) => {
    const res = await request.get('/users/999999');
    expect(res.status()).toBe(404);
  });

  test('POST /users/add creates a user and echoes submitted fields', async ({ request }) => {
    const payload = { firstName: 'Khala', lastName: 'Tester', age: 30 };
    const res = await request.post('/users/add', { data: payload });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.firstName).toBe(payload.firstName);
    expect(body.lastName).toBe(payload.lastName);
  });
});
