import { Page, Locator, expect } from '@playwright/test';

export class NotificationsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly description: Locator;
  readonly notificationList: Locator;
  readonly emptyState: Locator;
  readonly loadingSpinner: Locator;
  readonly unreadBadge: Locator;
  readonly markAllAsReadButton: Locator;
  readonly viewDetailsButtons: Locator;
  readonly markAsReadButtons: Locator;
  readonly notificationDetailsPopup: Locator;
  readonly popupCloseButton: Locator;
  readonly searchInput: Locator;
  readonly filterButton: Locator;
  readonly paginationControls: Locator;
  readonly nextPageButton: Locator;
  readonly previousPageButton: Locator;
  readonly pageSizeSelect: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1:has-text("Notifications")');
    this.description = page.locator('text=Personalized alerts about your trips');
    this.notificationList = page.locator('[role="group"]');
    this.emptyState = page.locator('text=All caught up');
    this.loadingSpinner = page.locator('.animate-spin').first();
    this.unreadBadge = page.locator('.rounded-full:has-text(/^\\d+$/)').first();
    this.markAllAsReadButton = page.locator('button:has-text("Mark all as read")');
    this.viewDetailsButtons = page.locator('button:has-text("VIEW DETAILS")');
    this.markAsReadButtons = page.locator('button:has-text("MARK AS READ")');
    this.notificationDetailsPopup = page.locator('[role="dialog"], [role="presentation"]').first();
    this.popupCloseButton = page.locator('[aria-label="Close notification details"]');
    this.searchInput = page.locator('input[placeholder*="Search"]').first();
    this.filterButton = page.locator('[aria-label*="Filter"]').first();
    this.paginationControls = page.locator('[aria-label*="Page"], [aria-label*="pagination"]').first();
    this.nextPageButton = page.locator('button:has-text("Next")').first();
    this.previousPageButton = page.locator('button:has-text("Previous")').first();
    this.pageSizeSelect = page.locator('select').first();
  }

  async goto() {
    await this.page.goto('http://localhost:5173/notifications');
    await this.page.waitForLoadState('networkidle');
  }

  async getPageTitle() {
    return await this.heading.textContent();
  }

  async isLoading() {
    return await this.loadingSpinner.isVisible({ timeout: 100 }).catch(() => false);
  }

  async waitForNotificationsToLoad(timeout = 5000) {
    await this.page.waitForSelector('[role="group"], text=All caught up', { timeout });
  }

  async getNotificationCount() {
    return await this.notificationList.count();
  }

  async getNotificationTitles(): Promise<string[]> {
    const elements = await this.notificationList.locator('h4').all();
    const titles: string[] = [];

    for (const element of elements) {
      const text = await element.textContent();
      if (text) {
        titles.push(text.trim());
      }
    }

    return titles;
  }

  async clickViewDetails(index = 0) {
    const buttons = this.viewDetailsButtons;
    await buttons.nth(index).click();
  }

  async isPopupVisible() {
    return await this.notificationDetailsPopup.isVisible({ timeout: 2000 }).catch(() => false);
  }

  async getPopupTitle() {
    return await this.notificationDetailsPopup.locator('h3, h4, h2').first().textContent();
  }

  async closePopup() {
    if (await this.popupCloseButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.popupCloseButton.click();
    }
  }

  async isPopupClosed() {
    return !(await this.notificationDetailsPopup.isVisible({ timeout: 500 }).catch(() => false));
  }

  async clickMarkAsRead(index = 0) {
    const buttons = this.markAsReadButtons;
    if ((await buttons.count()) > index) {
      await buttons.nth(index).click();
    }
  }

  async getUnreadCount() {
    const text = await this.unreadBadge.textContent();
    return text ? parseInt(text, 10) : 0;
  }

  async isEmptyStateVisible() {
    return await this.emptyState.isVisible({ timeout: 2000 }).catch(() => false);
  }

  async clickMarkAllAsRead() {
    await this.markAllAsReadButton.click();
  }

  async search(term: string) {
    if (await this.searchInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.searchInput.fill(term);
      await this.page.waitForTimeout(300); // Wait for debounce
    }
  }

  async clearSearch() {
    if (await this.searchInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.searchInput.clear();
      await this.page.waitForTimeout(300);
    }
  }

  async clickFilter() {
    if (await this.filterButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.filterButton.click();
    }
  }

  async selectFilterOption(optionText: string) {
    const option = this.page.locator(`text=${optionText}`).first();
    if (await option.isVisible({ timeout: 1000 }).catch(() => false)) {
      await option.click();
    }
  }

  async clickNextPage() {
    if (await this.nextPageButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.nextPageButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async clickPreviousPage() {
    if (await this.previousPageButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.previousPageButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async changePageSize(size: string) {
    if (await this.pageSizeSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.pageSizeSelect.selectOption(size);
      await this.page.waitForLoadState('networkidle');
    }
  }

  async getPaginationInfo() {
    const text = await this.paginationControls.textContent();
    return text?.trim() || '';
  }

  async isKeyboardNavigationSupported() {
    const firstButton = this.page.locator('button').first();
    if (await firstButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await firstButton.focus();
      return await firstButton.isFocused();
    }
    return false;
  }

  async pressEscape() {
    await this.page.keyboard.press('Escape');
  }

  async pressEnter() {
    await this.page.keyboard.press('Enter');
  }

  async pressTab() {
    await this.page.keyboard.press('Tab');
  }

  async setViewportSize(width: number, height: number) {
    await this.page.setViewportSize({ width, height });
    await this.page.goto('http://localhost:5173/notifications');
    await this.page.waitForLoadState('networkidle');
  }

  async getHeadingLevel(text: string): Promise<number | null> {
    const selectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

    for (const selector of selectors) {
      const element = this.page.locator(`${selector}:has-text("${text}")`);
      if (await element.isVisible({ timeout: 500 }).catch(() => false)) {
        const tag = await element.evaluate((el) => el.tagName);
        return parseInt(tag.slice(1), 10);
      }
    }

    return null;
  }

  async waitForToastNotification(timeout = 2000) {
    await this.page.waitForSelector('[role="alert"]', { timeout }).catch(() => {});
    return await this.page.locator('[role="alert"]').first().isVisible({ timeout: 500 }).catch(() => false);
  }

  async clickToast() {
    const toast = this.page.locator('[role="alert"]').first();
    if (await toast.isVisible({ timeout: 1000 }).catch(() => false)) {
      await toast.click();
    }
  }

  async getNotificationByTitle(title: string) {
    return this.page.locator(`text=${title}`).first();
  }

  async isNotificationVisible(title: string) {
    return await this.getNotificationByTitle(title).isVisible({ timeout: 1000 }).catch(() => false);
  }

  async verifyAccessibility() {
    // Basic accessibility checks
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').count();
    const buttons = await this.page.locator('button').count();
    const labels = await this.page.locator('label').count();

    return {
      hasHeadings: headings > 0,
      hasButtons: buttons > 0,
      hasProperStructure: headings > 0 && buttons > 0,
    };
  }

  async getColorContrast(element: Locator): Promise<{ color: string; backgroundColor: string } | null> {
    try {
      const result = await element.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor,
        };
      });
      return result;
    } catch {
      return null;
    }
  }

  async interceptAPIError() {
    await this.page.route('**/api/notifications', (route) => {
      route.abort();
    });
  }

  async stopInterceptingAPI() {
    await this.page.unroute('**/api/notifications');
  }

  async reload() {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
  }
}
