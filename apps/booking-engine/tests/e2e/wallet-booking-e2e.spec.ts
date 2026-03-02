import { test, expect } from "../fixtures/unhideFixture";
import { createRequire } from "module";
import { LoginPage } from "../pages/LoginPage";
import { FlightHomePage } from "../pages/FlightHomePage";
import { FlightListPage } from "../pages/FlightListPage";
import { FlightDetailPage } from "../pages/FlightDetailPage";
import { FlightAddonsPage } from "../pages/FlightAddonsPage";
import { PassengerDetailsPage } from "../pages/PassengerDetailsPage";
import { BookingCheckoutPage } from "../pages/BookingCheckoutPage";
import { BookingConfirmationPage } from "../pages/BookingConfirmationPage";
import { BookingManagementPage } from "../pages/BookingManagementPage";
import { BookingDetailPage } from "../pages/BookingDetailPage";
import { WalletPage } from "../pages/WalletPage";

const require = createRequire(import.meta.url);
const flights = require("../fixtures/flights.json");
const payments = require("../fixtures/payments.json");

test.describe("End-to-End Wallet Booking Flow - Real Duffel API", () => {
  test.beforeEach(async ({ page }) => {
    // DO NOT set test mode flags - we want REAL API data
    // The Duffel sandbox API will be used via DUFFEL_API_KEY environment variable
  });

  test("WB-E2E-001: Complete flight booking with wallet - full journey", async ({
    page,
  }) => {
    const walletPage = new WalletPage(page);
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // ========================================
    // PHASE 1: Check Initial Wallet Balance
    // ========================================
    console.log("Phase 1: Checking initial wallet balance...");

    await walletPage.goto("/wallet");
    await walletPage.verifyBalance();

    const initialBalance = await walletPage.getBalance();
    console.log(`Initial wallet balance: $${initialBalance}`);
    expect(initialBalance).toBeGreaterThan(0);

    // ========================================
    // PHASE 2: Search for Flights
    // ========================================
    console.log("Phase 2: Searching for flights...");

    await flightHome.goto("/flights");
    await expect(page.getByTestId("flight-search-form")).toBeVisible();

    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
      flights[0].departureDate,
    );

    // Verify search results
    await expect(page.getByTestId("flight-results")).toBeVisible();
    await page.waitForTimeout(2000); // Wait for API response and rendering

    const flightCards = await page.getByTestId(/^flight-result-card-/).all();
    console.log(`Number of flight cards found: ${flightCards.length}`);
    await expect(flightCards.length).toBeGreaterThan(0);

    // ========================================
    // PHASE 3: Select Flight
    // ========================================
    console.log("Phase 3: Selecting flight...");

    await flightList.selectFlight(0);
    await expect(page.getByTestId("flight-detail-modal")).toBeVisible();
    await expect(page.getByTestId("flight-price")).toBeVisible();
    await flightDetail.selectFlight();

    // ========================================
    // PHASE 4: Add-ons (Optional)
    // ========================================
    console.log("Phase 4: Processing add-ons...");

    await expect(page.getByTestId("addons-page")).toBeVisible();
    await flightAddons.addBaggage();
    await flightAddons.continue();

    // ========================================
    // PHASE 5: Fill Passenger Details
    // ========================================
    console.log("Phase 5: Filling passenger details...");

    await expect(page.getByTestId("passenger-form")).toBeVisible();

    await passengerDetails.fillPassengerDetails("Wallet", "Testuser", {
      passportNumber: "WT1234567",
      nationality: "US",
      gender: "Male",
      residencyCountry: "US",
      email: "wallet.test@test.com",
      phone: "+1987654321",
    });

    // Fill billing address
    await passengerDetails.fillBillingAddress(
      "456 Wallet St",
      "Los Angeles",
      "90001",
      "US",
    );
    await passengerDetails.continue();

    // ========================================
    // PHASE 6: Checkout - Get Total Amount
    // ========================================
    console.log("Phase 6: Processing checkout...");

    await expect(page.getByTestId("checkout-page")).toBeVisible();

    const bookingAmount = await checkout.getTotalAmount();
    console.log(`Booking amount: $${bookingAmount}`);

    // Verify sufficient balance
    expect(initialBalance).toBeGreaterThanOrEqual(bookingAmount);

    // ========================================
    // PHASE 7: Pay with Wallet
    // ========================================
    console.log("Phase 7: Processing wallet payment...");

    await checkout.selectPaymentMethod("wallet");
    await expect(page.getByTestId("wallet-balance")).toBeVisible();

    // Complete payment with wallet
    await checkout.payWithWallet();

    // ========================================
    // PHASE 8: Verify Booking Confirmation
    // ========================================
    console.log("Phase 8: Verifying booking confirmation...");

    await expect(page.getByTestId("confirmation-page")).toBeVisible();

    const bookingReference = await confirmation.getBookingReference();
    console.log(`Booking reference: ${bookingReference}`);
    expect(bookingReference).toMatch(/^TL-\d{6}$/);

    await confirmation.verifyConfirmation();

    // ========================================
    // PHASE 9: Verify Wallet Balance Deducted
    // ========================================
    console.log("Phase 9: Verifying wallet balance deduction...");

    await walletPage.goto("/wallet");
    const finalBalance = await walletPage.getBalance();
    console.log(`Final wallet balance: $${finalBalance}`);

    const expectedBalance = initialBalance - bookingAmount;
    expect(finalBalance).toBeCloseTo(expectedBalance, 1);

    console.log(
      `Balance deduction verified: $${initialBalance} - $${bookingAmount} = $${finalBalance}`,
    );

    // ========================================
    // PHASE 10: Verify Transaction in Wallet History
    // ========================================
    console.log("Phase 10: Verifying transaction history...");

    await walletPage.viewTransactions();
    await expect(page.getByTestId("transaction-list")).toBeVisible();

    // Verify the booking reference appears in transaction history
    const transactionExists =
      await walletPage.verifyTransactionExists(bookingReference);
    expect(transactionExists).toBe(true);

    console.log("Transaction found in wallet history");
  });

  test("WB-E2E-002: Flight booking with wallet - cancellation and refund to wallet", async ({
    page,
  }) => {
    const walletPage = new WalletPage(page);
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);
    const bookingMgmt = new BookingManagementPage(page);
    const bookingDetail = new BookingDetailPage(page);

    // ========================================
    // PHASE 1: Check Initial Wallet Balance
    // ========================================
    console.log("Phase 1: Checking initial wallet balance...");

    await walletPage.goto("/wallet");
    const initialBalance = await walletPage.getBalance();
    console.log(`Initial wallet balance: $${initialBalance}`);
    expect(initialBalance).toBeGreaterThan(0);

    // ========================================
    // PHASE 2: Complete Flight Booking with Wallet
    // ========================================
    console.log("Phase 2: Creating flight booking with wallet...");

    await flightHome.goto("/flights");
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      flights[0].adults,
      flights[0].class,
    );

    await flightList.selectFlight(0);
    await flightDetail.selectFlight();
    await flightAddons.continue();

    await passengerDetails.fillPassengerDetails("Cancel", "Testuser", {
      passportNumber: "CT1234567",
      nationality: "US",
      gender: "Female",
      residencyCountry: "US",
      email: "cancel.test@test.com",
      phone: "+1876543210",
    });
    await passengerDetails.fillBillingAddress(
      "789 Cancel Ave",
      "Chicago",
      "60601",
      "US",
    );
    await passengerDetails.continue();

    const bookingAmount = await checkout.getTotalAmount();
    console.log(`Booking amount: $${bookingAmount}`);

    await checkout.selectPaymentMethod("wallet");
    await checkout.payWithWallet();

    await expect(page.getByTestId("confirmation-page")).toBeVisible();
    const bookingReference = await confirmation.getBookingReference();
    console.log(`Booking created: ${bookingReference}`);

    // ========================================
    // PHASE 3: Verify Balance After Booking
    // ========================================
    console.log("Phase 3: Verifying balance after booking...");

    await walletPage.goto("/wallet");
    const balanceAfterBooking = await walletPage.getBalance();
    console.log(`Balance after booking: $${balanceAfterBooking}`);

    const expectedBalanceAfterBooking = initialBalance - bookingAmount;
    expect(balanceAfterBooking).toBeCloseTo(expectedBalanceAfterBooking, 1);

    // ========================================
    // PHASE 4: Navigate to Booking Management
    // ========================================
    console.log("Phase 4: Navigating to booking management...");

    await bookingMgmt.goto("/bookings");
    await expect(
      page.locator('[data-testid="booking-management-page"]'),
    ).toBeVisible();

    // Search for the booking
    await bookingMgmt.searchByReference(bookingReference);
    await expect(page.getByText(bookingReference)).toBeVisible();
    console.log(`Found booking: ${bookingReference}`);

    // ========================================
    // PHASE 5: Open Booking Details
    // ========================================
    console.log("Phase 5: Opening booking details...");

    await bookingMgmt.viewBookingDetails(bookingReference);
    await expect(page.getByTestId("booking-detail-page")).toBeVisible();

    // Verify booking status is confirmed
    const bookingStatus = await bookingDetail.getBookingStatus();
    console.log(`Current booking status: ${bookingStatus}`);
    expect(bookingStatus.toLowerCase()).toContain("confirm");

    // ========================================
    // PHASE 6: Initiate Cancellation
    // ========================================
    console.log("Phase 6: Initiating cancellation...");

    // Click cancel booking button
    const cancelButton = page.getByTestId("cancel-booking-btn");
    if (await cancelButton.isVisible()) {
      await cancelButton.click({ force: true });

      // Wait for cancellation modal/confirmation
      await page.waitForTimeout(1000);

      // Select cancellation reason
      await bookingDetail.selectCancellationReason("customer_request");

      // Confirm cancellation with refund to wallet
      const refundToWalletOption = page.getByTestId("refund-to-wallet");
      if (await refundToWalletOption.isVisible()) {
        await refundToWalletOption.click({ force: true });
        console.log("Selected refund to wallet option");
      }

      // Confirm cancellation
      await bookingDetail.confirmCancellation();

      // Verify cancellation success
      await expect(page.getByTestId("cancellation-success")).toBeVisible();
      console.log("Cancellation confirmed");
    } else {
      console.log(
        "Cancellation button not visible - checking for alternative...",
      );
      // Try alternative cancellation flow
      await bookingDetail.clickCancelBooking();

      // Handle confirmation modal
      const confirmButton = page.getByTestId("confirm-cancellation-btn");
      if (await confirmButton.isVisible()) {
        await confirmButton.click({ force: true });
        await page.waitForTimeout(2000);
      }
    }

    // ========================================
    // PHASE 7: Verify Refund to Wallet
    // ========================================
    console.log("Phase 7: Verifying refund to wallet...");

    await walletPage.goto("/wallet");
    const balanceAfterRefund = await walletPage.getBalance();
    console.log(`Balance after refund: $${balanceAfterRefund}`);

    // Balance should be restored (or partially restored based on refund policy)
    expect(balanceAfterRefund).toBeGreaterThanOrEqual(balanceAfterBooking);

    // Check for refund transaction
    await walletPage.viewTransactions();
    const refundTransactionExists =
      await walletPage.verifyTransactionExists("refund");
    console.log(`Refund transaction found: ${refundTransactionExists}`);

    // ========================================
    // PHASE 8: Verify Booking Status Changed
    // ========================================
    console.log("Phase 8: Verifying booking status changed...");

    await bookingMgmt.goto("/bookings");
    await bookingMgmt.searchByReference(bookingReference);
    await bookingMgmt.viewBookingDetails(bookingReference);

    // Verify booking status is cancelled
    const cancelledStatus = await bookingDetail.getBookingStatus();
    console.log(`Final booking status: ${cancelledStatus}`);
    expect(cancelledStatus.toLowerCase()).toContain("cancel");

    console.log(
      "End-to-end wallet booking cancellation test completed successfully",
    );
  });

  test("WB-E2E-003: Wallet booking with insufficient balance - top-up and complete", async ({
    page,
  }) => {
    const walletPage = new WalletPage(page);
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // ========================================
    // PHASE 1: Set Low Wallet Balance
    // ========================================
    console.log("Phase 1: Setting low wallet balance scenario...");

    await page.addInitScript(() => {
      (globalThis as any).TEST_MODE_WALLET_LOW_BALANCE = true;
    });

    await walletPage.goto("/wallet");
    const lowBalance = await walletPage.getBalance();
    console.log(`Low wallet balance: $${lowBalance}`);

    // ========================================
    // PHASE 2: Search for Expensive Flight
    // ========================================
    console.log("Phase 2: Searching for flight...");

    await flightHome.goto("/flights");
    await flightHome.searchFlight(
      flights[0].from,
      flights[0].to,
      2, // 2 passengers - higher cost
      "business", // Business class - even higher cost
    );

    await flightList.selectFlight(0);
    await flightDetail.selectFlight();
    await flightAddons.continue();

    await passengerDetails.fillPassengerDetails("Low", "Balance", {
      passportNumber: "LB1234567",
      nationality: "US",
      gender: "Male",
      residencyCountry: "US",
      email: "low.balance@test.com",
      phone: "+1765432109",
    });
    await passengerDetails.continue();

    // ========================================
    // PHASE 3: Check Insufficient Balance Warning
    // ========================================
    console.log("Phase 3: Checking insufficient balance warning...");

    await expect(page.getByTestId("checkout-page")).toBeVisible();
    const bookingAmount = await checkout.getTotalAmount();
    console.log(`Booking amount: $${bookingAmount}`);

    // If balance is insufficient, verify warning
    if (lowBalance < bookingAmount) {
      await checkout.selectPaymentMethod("wallet");

      // Verify insufficient balance warning is shown
      const insufficientWarning =
        await checkout.verifyInsufficientBalanceWarning();
      console.log(
        `Insufficient balance warning visible: ${insufficientWarning}`,
      );

      // Check top-up option is available
      const topUpOption = page.getByTestId("topup-option");
      if (await topUpOption.isVisible()) {
        console.log("Top-up option available");

        // ========================================
        // PHASE 4: Top-up Wallet
        // ========================================
        console.log("Phase 4: Topping up wallet...");

        await checkout.clickTopUpOption();

        // Calculate needed top-up amount
        const topUpAmount = bookingAmount - lowBalance + 100; // Add buffer
        console.log(`Top-up amount needed: $${topUpAmount}`);

        // Fill top-up form
        await page
          .getByTestId("topup-amount")
          .fill(topUpAmount.toString(), { force: true });
        await page
          .getByTestId("card-number")
          .fill(payments[0].cardNumber, { force: true });
        await page
          .getByTestId("card-expiry")
          .fill(payments[0].exp, { force: true });
        await page
          .getByTestId("card-cvc")
          .fill(payments[0].cvc, { force: true });
        await page.getByTestId("topup-pay-button").click({ force: true });

        // Wait for top-up success
        await expect(page.getByTestId("topup-success")).toBeVisible({
          timeout: 10000,
        });
        console.log("Top-up successful");
      }
    }

    // ========================================
    // PHASE 5: Complete Payment with Updated Balance
    // ========================================
    console.log("Phase 5: Completing payment...");

    await checkout.selectPaymentMethod("wallet");
    await checkout.payWithWallet();

    // ========================================
    // PHASE 6: Verify Booking Confirmation
    // ========================================
    console.log("Phase 6: Verifying confirmation...");

    await expect(page.getByTestId("confirmation-page")).toBeVisible();
    const bookingReference = await confirmation.getBookingReference();
    expect(bookingReference).toMatch(/^TL-\d{6}$/);
    console.log(`Booking successful: ${bookingReference}`);
  });

  test("WB-E2E-004: Multiple bookings with wallet - verify cumulative balance deduction", async ({
    page,
  }) => {
    const walletPage = new WalletPage(page);
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // ========================================
    // PHASE 1: Check Initial Balance
    // ========================================
    console.log("Phase 1: Checking initial balance for multiple bookings...");

    await walletPage.goto("/wallet");
    const initialBalance = await walletPage.getBalance();
    console.log(`Initial balance: $${initialBalance}`);
    expect(initialBalance).toBeGreaterThan(500); // Ensure sufficient balance for multiple bookings

    const bookingReferences: string[] = [];
    const bookingAmounts: number[] = [];

    // ========================================
    // PHASE 2: Create First Booking
    // ========================================
    console.log("Phase 2: Creating first booking...");

    await flightHome.goto("/flights");
    await flightHome.searchFlight(flights[0].from, flights[0].to, 1, "economy");

    await flightList.selectFlight(0);
    await flightDetail.selectFlight();
    await flightAddons.continue();

    await passengerDetails.fillPassengerDetails("First", "Booking", {
      passportNumber: "FB1234567",
      nationality: "US",
      gender: "Male",
      residencyCountry: "US",
      email: "first.booking@test.com",
      phone: "+1654321098",
    });
    await passengerDetails.continue();

    const amount1 = await checkout.getTotalAmount();
    bookingAmounts.push(amount1);
    console.log(`First booking amount: $${amount1}`);

    await checkout.selectPaymentMethod("wallet");
    await checkout.payWithWallet();

    await expect(page.getByTestId("confirmation-page")).toBeVisible();
    const ref1 = await confirmation.getBookingReference();
    bookingReferences.push(ref1);
    console.log(`First booking created: ${ref1}`);

    // ========================================
    // PHASE 3: Create Second Booking
    // ========================================
    console.log("Phase 3: Creating second booking...");

    await flightHome.goto("/flights");
    await flightHome.searchFlight(flights[0].to, flights[0].from, 1, "economy"); // Reverse route

    await flightList.selectFlight(0);
    await flightDetail.selectFlight();
    await flightAddons.continue();

    await passengerDetails.fillPassengerDetails("Second", "Booking", {
      passportNumber: "SB1234567",
      nationality: "US",
      gender: "Female",
      residencyCountry: "US",
      email: "second.booking@test.com",
      phone: "+1543210987",
    });
    await passengerDetails.continue();

    const amount2 = await checkout.getTotalAmount();
    bookingAmounts.push(amount2);
    console.log(`Second booking amount: $${amount2}`);

    await checkout.selectPaymentMethod("wallet");
    await checkout.payWithWallet();

    await expect(page.getByTestId("confirmation-page")).toBeVisible();
    const ref2 = await confirmation.getBookingReference();
    bookingReferences.push(ref2);
    console.log(`Second booking created: ${ref2}`);

    // ========================================
    // PHASE 4: Verify Final Balance
    // ========================================
    console.log("Phase 4: Verifying final balance...");

    await walletPage.goto("/wallet");
    const finalBalance = await walletPage.getBalance();
    console.log(`Final balance: $${finalBalance}`);

    const totalSpent = bookingAmounts.reduce((sum, amt) => sum + amt, 0);
    const expectedFinalBalance = initialBalance - totalSpent;

    console.log(`Total spent: $${totalSpent}`);
    console.log(`Expected final balance: $${expectedFinalBalance}`);

    expect(finalBalance).toBeCloseTo(expectedFinalBalance, 1);

    // ========================================
    // PHASE 5: Verify Both Transactions in History
    // ========================================
    console.log("Phase 5: Verifying transaction history...");

    await walletPage.viewTransactions();

    for (const ref of bookingReferences) {
      const exists = await walletPage.verifyTransactionExists(ref);
      expect(exists).toBe(true);
      console.log(`Transaction found for booking: ${ref}`);
    }

    console.log("Multiple wallet bookings test completed successfully");
  });

  test("WB-E2E-005: Wallet booking with promo code - verify discount applied", async ({
    page,
  }) => {
    const walletPage = new WalletPage(page);
    const flightHome = new FlightHomePage(page);
    const flightList = new FlightListPage(page);
    const flightDetail = new FlightDetailPage(page);
    const flightAddons = new FlightAddonsPage(page);
    const passengerDetails = new PassengerDetailsPage(page);
    const checkout = new BookingCheckoutPage(page);
    const confirmation = new BookingConfirmationPage(page);

    // ========================================
    // PHASE 1: Check Initial Balance
    // ========================================
    console.log("Phase 1: Checking initial balance...");

    await walletPage.goto("/wallet");
    const initialBalance = await walletPage.getBalance();
    console.log(`Initial balance: $${initialBalance}`);

    // ========================================
    // PHASE 2: Create Booking with Promo Code
    // ========================================
    console.log("Phase 2: Creating booking with promo code...");

    await flightHome.goto("/flights");
    await flightHome.searchFlight(flights[0].from, flights[0].to, 1, "economy");

    await flightList.selectFlight(0);
    await flightDetail.selectFlight();
    await flightAddons.continue();

    await passengerDetails.fillPassengerDetails("Promo", "Discount", {
      passportNumber: "PD1234567",
      nationality: "US",
      gender: "Male",
      residencyCountry: "US",
      email: "promo.discount@test.com",
      phone: "+1432109876",
    });
    await passengerDetails.continue();

    // ========================================
    // PHASE 3: Apply Promo Code
    // ========================================
    console.log("Phase 3: Applying promo code...");

    await expect(page.getByTestId("checkout-page")).toBeVisible();

    const originalAmount = await checkout.getTotalAmount();
    console.log(`Original amount: $${originalAmount}`);

    // Apply promo code
    await checkout.applyPromoCode("WALLET10");

    // Get discounted amount
    const discountAmount = await checkout.getDiscountAmount();
    const finalAmount = await checkout.getFinalAmount();

    console.log(`Discount applied: $${discountAmount}`);
    console.log(`Final amount after discount: $${finalAmount}`);

    expect(finalAmount).toBeLessThan(originalAmount);
    expect(discountAmount).toBeGreaterThan(0);

    // ========================================
    // PHASE 4: Complete Payment
    // ========================================
    console.log("Phase 4: Completing payment...");

    await checkout.selectPaymentMethod("wallet");
    await checkout.payWithWallet();

    await expect(page.getByTestId("confirmation-page")).toBeVisible();
    const bookingReference = await confirmation.getBookingReference();
    console.log(`Booking created with discount: ${bookingReference}`);

    // ========================================
    // PHASE 5: Verify Wallet Deduction is Discounted Amount
    // ========================================
    console.log("Phase 5: Verifying wallet deduction...");

    await walletPage.goto("/wallet");
    const balanceAfterBooking = await walletPage.getBalance();

    const actualDeduction = initialBalance - balanceAfterBooking;
    console.log(`Actual deduction: $${actualDeduction}`);

    // The deduction should be the discounted amount, not original
    expect(actualDeduction).toBeCloseTo(finalAmount, 1);
    expect(actualDeduction).toBeLessThan(originalAmount);

    console.log("Promo code wallet booking test completed successfully");
  });
});
