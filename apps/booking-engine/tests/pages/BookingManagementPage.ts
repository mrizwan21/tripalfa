import { BasePage } from './BasePage';

interface FilterOptions {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  service?: string;
}

export class BookingManagementPage extends BasePage {
  // Existing methods
  async filterByService(service: string) {
    await this.setSelectValue('service-filter', service);
  }

  async searchByReference(ref: string) {
    await this.getByTestId('booking-search').fill(ref, { force: true });
    await this.getByTestId('search-button').click({ force: true });
  }

  async sortByDate() {
    await this.getByTestId('sort-date').click({ force: true });
  }

  async selectBooking(index: number = 0) {
    await this.getByTestId(`booking-row-${index}`).click({ force: true });
    await this.waitForNavigation();
  }

  async viewBookingDetails(bookingReference: string) {
    await this.getByText(bookingReference).click({ force: true });
    await this.page.waitForSelector('[data-testid="booking-detail-page"]', { timeout: 10000 });
  }

  async viewBookingDetailsFromList(index: number = 0) {
    await this.getByTestId(`booking-card-${index}`).click({ force: true });
    await this.page.waitForSelector('[data-testid="booking-detail-page"]', { timeout: 10000 });
  }

  // New methods for Day 5-6
  async sortByStatus() {
    await this.getByTestId('sort-status').click({ force: true });
  }

  async selectMultipleBookings(indices: number[]) {
    for (const index of indices) {
      const checkbox = this.getByTestId(`booking-checkbox-${index}`);
      await checkbox.click({ force: true });
    }
  }

  async exportSelectedBookings() {
    await this.getByTestId('export-selected-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="export-success"]', { timeout: 10000 });
  }

  async filterByDateRange(dateFrom: string, dateTo: string) {
    await this.getByTestId('date-from').fill(dateFrom, { force: true });
    await this.getByTestId('date-to').fill(dateTo, { force: true });
    await this.getByTestId('apply-date-filter').click({ force: true });
  }

  async filterByStatus(status: string) {
    await this.setSelectValue('status-filter', status);
  }

  async applyCombinedFilters(filters: FilterOptions) {
    if (filters.dateFrom && filters.dateTo) {
      await this.filterByDateRange(filters.dateFrom, filters.dateTo);
    }
    if (filters.status) {
      await this.filterByStatus(filters.status);
    }
    if (filters.service) {
      await this.filterByService(filters.service);
    }
    await this.getByTestId('apply-filters-btn').click({ force: true });
  }

  async clearAllFilters() {
    await this.getByTestId('clear-filters-btn').click({ force: true });
  }

  async getBookingCount(): Promise<number> {
    const rows = await this.page.locator('[data-testid^="booking-row-"]').count();
    return rows;
  }

  async verifyBookingVisible(bookingReference: string): Promise<boolean> {
    const booking = this.page.locator(`[data-testid="booking-reference"]:has-text("${bookingReference}")`);
    return await booking.isVisible().catch(() => false);
  }

  async navigateToNextPage() {
    await this.getByTestId('next-page-btn').click({ force: true });
    await this.page.waitForTimeout(1000); // Wait for page transition
  }

  async navigateToPreviousPage() {
    await this.getByTestId('prev-page-btn').click({ force: true });
    await this.page.waitForTimeout(1000); // Wait for page transition
  }

  async selectAllBookings() {
    await this.getByTestId('select-all-checkbox').click({ force: true });
  }

  async bulkCancelSelected() {
    await this.getByTestId('bulk-cancel-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="bulk-cancel-confirm"]', { timeout: 10000 });
  }

  async bulkExportSelected() {
    await this.getByTestId('bulk-export-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="export-success"]', { timeout: 10000 });
  }
}
