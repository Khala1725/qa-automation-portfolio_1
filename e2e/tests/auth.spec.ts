import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';

/**
 * Auth suite: standard login, locked-out user, and invalid credential handling.
 * Sauce Demo exposes several seeded users (standard_user, locked_out_user, etc.)
 * which makes it a good sandbox for demonstrating negative-path coverage.
 */
test.describe('Authentication', () => {
  test('standard user can log in and reach the inventory page', async ({ page }) => {
    const login = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await login.open();
    await login.login('standard_user', 'secret_sauce');

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(inventory.inventoryItems.first()).toBeVisible();
  });

  test('locked out user is blocked with a clear error message', async ({ page }) => {
    const login = new LoginPage(page);

    await login.open();
    await login.login('locked_out_user', 'secret_sauce');

    await login.expectErrorContaining('locked out');
    await expect(page).toHaveURL(/^https:\/\/www\.saucedemo\.com\/$/);
  });

  test('invalid password is rejected', async ({ page }) => {
    const login = new LoginPage(page);

    await login.open();
    await login.login('standard_user', 'wrong_password');

    await login.expectErrorContaining('do not match');
  });

  test('empty credentials are rejected with a validation message', async ({ page }) => {
    const login = new LoginPage(page);

    await login.open();
    await login.login('', '');

    await login.expectErrorContaining('Username is required');
  });
});
