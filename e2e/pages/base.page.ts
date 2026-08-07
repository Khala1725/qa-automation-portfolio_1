import { Page } from '@playwright/test';

/**
 * BasePage centralises behaviour shared by every page object:
 * navigation, waiting helpers, and common assertions live here so
 * individual page objects stay focused on their own locators/actions.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  async title(): Promise<string> {
    return this.page.title();
  }

  async currentUrl(): Promise<string> {
    return this.page.url();
  }
}
