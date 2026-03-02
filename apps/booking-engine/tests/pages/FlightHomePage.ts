import { BasePage } from "./BasePage";

export class FlightHomePage extends BasePage {
  async searchFlight(
    from: string,
    to: string,
    adults: number,
    travelClass: string,
    date?: string,
  ) {
    // Use 'force: true' to interact with hidden elements (bypasses visibility check)
    await this.getByTestId("flight-from").fill(from, { force: true });
    await this.getByTestId("flight-to").fill(to, { force: true });
    // Use setSelectValue for hidden select elements instead of selectOption
    await this.setSelectValue("flight-adults", adults.toString());
    await this.setSelectValue("flight-class", travelClass);
    if (date) {
      await this.getByTestId("flight-date").fill(date, { force: true });
    }
    await this.getByTestId("flight-search-submit").click({ force: true });
    await this.page.waitForURL("**/flights/list**", { timeout: 10000 });
  }

  async searchRoundTrip(
    from: string,
    to: string,
    departureDate: string,
    returnDate: string,
    adults: number,
    travelClass: string,
  ) {
    await this.setSelectValue("flight-trip-type", "round-trip");
    await this.getByTestId("flight-from").fill(from, { force: true });
    await this.getByTestId("flight-to").fill(to, { force: true });
    await this.getByTestId("flight-departure-date").fill(departureDate, {
      force: true,
    });
    await this.getByTestId("flight-return-date").fill(returnDate, {
      force: true,
    });
    await this.setSelectValue("flight-adults", adults.toString());
    await this.setSelectValue("flight-class", travelClass);
    await this.getByTestId("flight-search-submit").click({ force: true });
    await this.waitForNavigation();
  }

  // Enhanced methods for advanced flight booking
  async selectTripType(tripType: "one-way" | "round-trip" | "multi-city") {
    await this.setSelectValue("flight-trip-type", tripType);
  }

  async addMultiCityLeg(
    from: string,
    to: string,
    date: string,
    adults: number,
    travelClass: string,
  ) {
    await this.getByTestId("add-multi-city-leg").click({ force: true });
    const legIndex = await this.getMultiCityLegCount();

    await this.getByTestId(`multi-city-from-${legIndex}`).fill(from, {
      force: true,
    });
    await this.getByTestId(`multi-city-to-${legIndex}`).fill(to, {
      force: true,
    });
    await this.getByTestId(`multi-city-date-${legIndex}`).fill(date, {
      force: true,
    });
    await this.setSelectValue(
      `multi-city-adults-${legIndex}`,
      adults.toString(),
    );
    await this.setSelectValue(`multi-city-class-${legIndex}`, travelClass);
  }

  async searchMultiCity() {
    await this.getByTestId("flight-search-submit").click({ force: true });
    await this.page.waitForURL("**/flights/list**", { timeout: 15000 });
  }

  async getMultiCityLegCount(): Promise<number> {
    const legs = await this.getByTestId("multi-city-leg").all();
    return legs.length;
  }
}
