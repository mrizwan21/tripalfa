import { BasePage } from './BasePage';

export class HotelHomePage extends BasePage {
  async searchHotel(city: string, checkInDate: string, checkOutDate: string, adults: number, rooms: number) {
    // Use 'force: true' to interact with hidden elements
    await this.getByTestId('hotel-city').fill(city, { force: true });
    await this.getByTestId('hotel-checkin-date').fill(checkInDate, { force: true });
    await this.getByTestId('hotel-checkout-date').fill(checkOutDate, { force: true });
    // Use setSelectValue for hidden select elements instead of selectOption
    await this.setSelectValue('hotel-adults', adults.toString());
    await this.setSelectValue('hotel-rooms', rooms.toString());
    await this.getByTestId('hotel-search-submit').click({ force: true });
    await this.waitForNavigation();
  }

  // Enhanced methods for advanced hotel booking
  async filterByChain(chainName: string) {
    await this.setSelectValue('hotel-chain-filter', chainName);
  }

  async enableCorporateBooking() {
    await this.getByTestId('corporate-booking-toggle').click({ force: true });
  }

  async fillCorporateDetails(details: {
    companyName: string;
    billingCode: string;
    costCenter: string;
    poNumber: string;
    taxExempt: boolean;
  }) {
    await this.getByTestId('corporate-company-name').fill(details.companyName, { force: true });
    await this.getByTestId('corporate-billing-code').fill(details.billingCode, { force: true });
    await this.getByTestId('corporate-cost-center').fill(details.costCenter, { force: true });
    await this.getByTestId('corporate-po-number').fill(details.poNumber, { force: true });
    if (details.taxExempt) {
      await this.getByTestId('corporate-tax-exempt').check({ force: true });
    }
  }

  async enablePackageDeal() {
    await this.getByTestId('package-deal-toggle').click({ force: true });
  }

  async selectPackageDeal(dealType: 'flight-hotel' | 'hotel-car' | 'all-inclusive') {
    await this.setSelectValue('package-deal-type', dealType);
  }

  async configureFlightDetails(details: {
    from: string;
    to: string;
    departureDate: string;
    returnDate: string;
    airlinePreference: string;
  }) {
    await this.getByTestId('package-flight-from').fill(details.from, { force: true });
    await this.getByTestId('package-flight-to').fill(details.to, { force: true });
    await this.getByTestId('package-flight-departure').fill(details.departureDate, { force: true });
    await this.getByTestId('package-flight-return').fill(details.returnDate, { force: true });
    await this.setSelectValue('package-airline-preference', details.airlinePreference);
  }

  async filterByAvailability(availabilityType: 'last-minute' | 'extended-stay' | 'standard') {
    await this.setSelectValue('availability-filter', availabilityType);
  }
}
