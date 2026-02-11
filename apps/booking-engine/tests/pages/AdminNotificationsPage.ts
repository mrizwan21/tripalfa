import { Page } from '@playwright/test';

export class AdminNotificationsPage {
  constructor(private page: Page) {}

  async goto(path: string = '/admin/notifications') {
    await this.page.goto(path);
  }

  async selectCustomers(customerEmails: string[]) {
    for (const email of customerEmails) {
      await this.page.check(`input[value="${email}"]`);
    }
  }

  async composeBulkNotification(notification: {
    title: string;
    message: string;
    type: string;
    channels: string[];
  }) {
    await this.page.fill('input[placeholder="Notification Title"]', notification.title);
    await this.page.fill('textarea[placeholder="Notification Message"]', notification.message);
    await this.page.selectOption('select[name="type"]', notification.type);

    for (const channel of notification.channels) {
      await this.page.check(`input[value="${channel}"]`);
    }
  }

  async sendBulkNotification() {
    await this.page.click('button:has-text("Send Notification")');
  }

  async verifyNotificationSent() {
    await this.page.waitForSelector('text=Notifications sent successfully');
  }

  async viewNotificationHistory() {
    await this.page.click('button:has-text("View History")');
  }

  async filterByStatus(status: string) {
    await this.page.selectOption('select[name="status"]', status);
  }

  async searchNotifications(query: string) {
    await this.page.fill('input[placeholder="Search notifications"]', query);
    await this.page.click('button:has-text("Search")');
  }
}