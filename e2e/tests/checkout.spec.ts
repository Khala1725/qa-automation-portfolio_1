import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';
import { CheckoutPage } from '../pages/checkout.page';

test.describe('Cart and checkout', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.open();
    await login.login('standard_user', 'secret_sauce');
  });

  test('adding items updates the cart badge count', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await inventory.addItemToCartByName('Sauce Labs Backpack');
    await inventory.addItemToCartByName('Sauce Labs Bike Light');

    expect(await inventory.cartCount()).toBe(2);
  });

  test('products can be sorted low to high by price', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await inventory.sortBy('lohi');
    const prices = await inventory.itemPrices();
    const sorted = [...prices].sort((a, b) => a - b);

    expect(prices).toEqual(sorted);
  });

  test('completes a full purchase end-to-end', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const checkout = new CheckoutPage(page);

    await inventory.addItemToCartByName('Sauce Labs Backpack');
    await inventory.goToCart();
    await checkout.startCheckout();
    await checkout.fillCustomerInfo('Khala', 'Tester', '2000');

    const total = await checkout.totalText();
    expect(total).toMatch(/Total: \$\d+\.\d{2}/);

    await checkout.finish();
    await expect(checkout.completeHeader).toHaveText(/Thank you/i);
  });
});
