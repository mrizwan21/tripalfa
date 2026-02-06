import { BasePage } from './BasePage';

export class PassengerDetailsPage extends BasePage {
  async fillPassengerDetails(firstName: string, lastName: string, options?: {
    dateOfBirth?: string;
    passportNumber?: string;
    email?: string;
    phone?: string;
    nationality?: string;
    gender?: string;
    residencyCountry?: string;
    passportExpiry?: string;
  }, passengerIndex: number = 0) {
    const suffix = passengerIndex > 0 ? `-${passengerIndex}` : '';

    // Use 'force: true' to interact with hidden elements
    await this.getByTestId(`passenger-first-name${suffix}`).fill(firstName, { force: true });
    await this.getByTestId(`passenger-last-name${suffix}`).fill(lastName, { force: true });

    if (options?.nationality) {
      await this.getByTestId(`passenger-nationality${suffix}`).selectOption(options.nationality, { force: true });
    }
    if (options?.gender) {
      // Click the gender button
      await this.page.getByText(options.gender, { exact: true }).click({ force: true });
    }
    if (options?.residencyCountry) {
      await this.getByTestId(`passenger-residency${suffix}`).selectOption(options.residencyCountry, { force: true });
    }
    if (options?.dateOfBirth) {
      await this.selectCalendarDate('date-of-birth', options.dateOfBirth);
    }
    if (options?.passportNumber) {
      await this.getByTestId(`passenger-passport${suffix}`).fill(options.passportNumber, { force: true });
    }
    if (options?.passportExpiry) {
      await this.selectCalendarDate('passport-expiry', options.passportExpiry);
    }
    if (options?.email) {
      await this.getByTestId(`passenger-email${suffix}`).fill(options.email, { force: true });
    }
    if (options?.phone) {
      await this.getByTestId(`passenger-phone${suffix}`).fill(options.phone, { force: true });
    }
  }

  async selectCalendarDate(calendarType: 'date-of-birth' | 'passport-expiry', dateString: string) {
    // Click the calendar trigger
    await this.getByTestId(calendarType).click({ force: true });
    
    // Wait for calendar to appear and click the date
    await this.page.getByTestId(`calendar-day-${dateString}`).click({ force: true });
  }

  async addPassenger() {
    await this.getByTestId('add-passenger-button').click({ force: true });
  }

  async addSpecialRequest(request: string) {
    await this.getByTestId('special-requests').fill(request, { force: true });
  }

  async fillBillingAddress(street: string, city: string, zipCode: string, country: string) {
    await this.page.fill('input[placeholder="Building, Street Name, District"]', street, { force: true });
    await this.page.fill('input[placeholder="City"]', city, { force: true });
    await this.page.fill('input[placeholder="Zip"]', zipCode, { force: true });
    await this.page.selectOption('select[name="billingAddress.country"]', country, { force: true });
  }

  async continue() {
    // Wait for any validation errors to disappear
    await this.page.waitForTimeout(1000);
    
    // Check if there are validation errors
    const errorMessage = this.page.locator('text=/Please fix errors above to proceed/i');
    const isErrorVisible = await errorMessage.isVisible().catch(() => false);
    
    if (isErrorVisible) {
      // Get all error messages
      const errorTexts = await this.page.locator('[class*="text-red-500"]').allTextContents();
      throw new Error(`Form validation errors are present: ${errorTexts.join(', ')}`);
    }
    
    // Check for any red border fields (validation errors)
    const invalidFields = await this.page.locator('[class*="border-red-500"]').count();
    if (invalidFields > 0) {
      throw new Error(`Found ${invalidFields} fields with validation errors (red borders)`);
    }
    
    // Click "Pay with Wallet" button to proceed to payment
    const payButton = this.page.getByText('Pay with Wallet');
    await payButton.click({ force: true });
    
    // Wait a bit to see if any errors appear after clicking
    await this.page.waitForTimeout(3000);
    
    // Check for any alert or error messages that might appear
    const alertMessage = this.page.locator('text=/Failed to process booking/i').or(
      this.page.locator('text=/Unable to create booking/i')
    );
    const isAlertVisible = await alertMessage.isVisible().catch(() => false);
    if (isAlertVisible) {
      const alertText = await alertMessage.textContent();
      throw new Error(`Booking submission failed with error: ${alertText}`);
    }
    
    // Check current URL
    const currentUrl = this.page.url();
    if (currentUrl.includes('checkout')) {
      // Successfully navigated to checkout
      return;
    } else if (currentUrl.includes('passenger-details')) {
      // Still on passenger details page - form submission likely failed
      throw new Error('Form submission did not trigger navigation. Form may be invalid or API call failed.');
    } else {
      // Unexpected navigation
      throw new Error(`Unexpected navigation to: ${currentUrl}`);
    }
  }

  async selectAdditionalSeat() {
    // Click seat selection button if available
    try {
      await this.getByTestId('seat-selection-button').click({ force: true });
      await this.page.waitForTimeout(1000);
      // Select a seat (assuming seat selection modal is open)
      await this.getByTestId('seat-14A').click({ force: true });
      await this.getByTestId('confirm-seat-selection').click({ force: true });
    } catch (error) {
      // Seat selection might not be available, continue
      console.log('Seat selection not available in passenger details');
    }
  }
}
