import { BasePage } from './BasePage';
import { expect } from '@playwright/test';

interface PassengerInfo {
  firstName: string;
  lastName: string;
  passport: string;
}

interface FilterOptions {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  service?: string;
}

export class BookingDetailPage extends BasePage {
  async verifyDetails() {
    await this.getByTestId('booking-detail').waitFor();
  }

  // Booking Modification Methods
  async clickModifyBooking() {
    await this.getByTestId('modify-booking-btn').click({ force: true });
    await this.waitForNavigation();
  }

  async modifyDates(checkIn: string, checkOut: string) {
    await this.getByTestId('checkin-date').fill(checkIn, { force: true });
    await this.getByTestId('checkout-date').fill(checkOut, { force: true });
  }

  async addPassenger(passenger: PassengerInfo) {
    await this.getByTestId('add-passenger-btn').click({ force: true });
    await this.getByTestId('passenger-firstname').fill(passenger.firstName, { force: true });
    await this.getByTestId('passenger-lastname').fill(passenger.lastName, { force: true });
    await this.getByTestId('passenger-passport').fill(passenger.passport, { force: true });
  }

  async saveModifications() {
    await this.getByTestId('save-modifications-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="modification-success"]', { timeout: 10000 });
  }

  // Cancellation Methods
  async clickCancelBooking() {
    await this.getByTestId('cancel-booking-btn').click({ force: true });
    await this.waitForNavigation();
  }

  async selectCancellationReason(reason: string) {
    await this.setSelectValue('cancellation-reason', reason);
  }

  async confirmCancellation() {
    await this.getByTestId('confirm-cancellation-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="cancellation-success"]', { timeout: 10000 });
  }

  // Status and History Methods
  async viewStatusHistory() {
    await this.getByTestId('view-status-history').click({ force: true });
    await this.page.waitForSelector('[data-testid="status-timeline"]', { timeout: 10000 });
  }

  // Amendment Methods
  async clickAmendBooking() {
    await this.getByTestId('amend-booking-btn').click({ force: true });
    await this.waitForNavigation();
  }

  async selectNewFlightOption(optionType: string) {
    await this.getByTestId(`flight-option-${optionType}`).click({ force: true });
    await this.page.waitForSelector('[data-testid="price-difference"]', { timeout: 10000 });
  }

  async proceedToPayment() {
    await this.getByTestId('proceed-to-payment-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="payment-page"]', { timeout: 10000 });
  }

  // Rebooking Methods
  async clickRebook() {
    await this.getByTestId('rebook-btn').click({ force: true });
    await this.waitForNavigation();
  }

  async selectAlternativeFlight(index: number) {
    await this.getByTestId(`alternative-flight-${index}`).click({ force: true });
  }

  async confirmRebooking() {
    await this.getByTestId('confirm-rebooking-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="new-booking-reference"]', { timeout: 10000 });
  }

  // Notes and Special Requests Methods
  async addNote(noteText: string) {
    await this.getByTestId('add-note-btn').click({ force: true });
    await this.getByTestId('note-textarea').fill(noteText, { force: true });
    await this.getByTestId('save-note-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="note-added"]', { timeout: 10000 });
  }

  async viewSpecialRequests() {
    await this.getByTestId('view-special-requests').click({ force: true });
    await this.page.waitForSelector('[data-testid="special-requests-list"]', { timeout: 10000 });
  }

  async updateSpecialRequest(request: string) {
    await this.getByTestId('update-request-btn').click({ force: true });
    await this.getByTestId('special-request-input').fill(request, { force: true });
    await this.getByTestId('save-request-btn').click({ force: true });
    await this.page.waitForSelector('[data-testid="request-updated"]', { timeout: 10000 });
  }

  // Additional utility methods
  async getBookingReference(): Promise<string> {
    const refElement = await this.getByTestId('booking-reference');
    return refElement.textContent() || '';
  }

  async getBookingStatus(): Promise<string> {
    const statusElement = await this.getByTestId('booking-status');
    return statusElement.textContent() || '';
  }

  async verifyPassengerCount(expectedCount: number) {
    const passengers = await this.page.locator('[data-testid^="passenger-row-"]').count();
    expect(passengers).toBe(expectedCount);
  }

  async verifyTotalAmount(expectedAmount: string) {
    const amount = await this.getByTestId('total-amount').textContent();
    expect(amount).toContain(expectedAmount);
  }
}
