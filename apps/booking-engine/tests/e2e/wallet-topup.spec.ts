import { test, expect } from '../fixtures/unhideFixture';

test.describe('Wallet Top-Up Flow', () => {
  
  test('WT-001: Top up wallet with $5000 USD and verify dashboard update', async ({ page }) => {
    // ========================================
    // PHASE 1: Check Initial Wallet Balance
    // ========================================
    console.log('Phase 1: Checking initial wallet balance...');
    
    await page.goto('/wallet');
    
    // Wait for wallet-balance element to be visible
    const walletBalanceLocator = page.getByTestId('wallet-balance');
    await walletBalanceLocator.waitFor({ state: 'visible', timeout: 30000 });
    
    const initialBalanceText = await walletBalanceLocator.textContent();
    console.log(`Initial balance text: ${initialBalanceText}`);
    
    // Parse initial balance (remove currency symbols)
    const initialBalance = parseFloat(initialBalanceText?.replace(/[^0-9.]/g, '') || '0');
    console.log(`Initial wallet balance: $${initialBalance}`);
    expect(initialBalance).toBeGreaterThanOrEqual(0);

    // ========================================
    // PHASE 2: Navigate to Dashboard and Check Balance
    // ========================================
    console.log('Phase 2: Checking dashboard wallet snapshot...');
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Find the wallet snapshot card
    const walletSnapshotCard = page.locator('div:has-text("Wallet snapshot")').first();
    await expect(walletSnapshotCard).toBeVisible();
    
    // Get the balance from dashboard
    const dashboardBalanceText = await walletSnapshotCard.locator('.font-medium').first().textContent();
    const dashboardBalance = parseFloat(dashboardBalanceText?.replace(/[^0-9.]/g, '') || '0');
    console.log(`Dashboard wallet balance: $${dashboardBalance}`);
    
    // Dashboard should show same balance as wallet page
    expect(Math.abs(dashboardBalance - initialBalance)).toBeLessThan(1);

    // ========================================
    // PHASE 3: Navigate to Top-Up Page
    // ========================================
    console.log('Phase 3: Navigating to top-up page...');
    
    // Go back to wallet and click top-up
    await page.goto('/wallet');
    await walletBalanceLocator.waitFor({ state: 'visible', timeout: 30000 });
    
    const topUpButton = page.getByTestId('topup-btn');
    await expect(topUpButton).toBeVisible();
    await topUpButton.click();
    
    // Wait for top-up page
    await page.waitForURL('**/wallet/topup**', { timeout: 10000 });
    console.log('On top-up page');

    // ========================================
    // PHASE 4: Enter Top-Up Amount ($5000)
    // ========================================
    console.log('Phase 4: Entering top-up amount...');
    
    // Find the amount input
    const amountInput = page.locator('#topup-amount');
    await expect(amountInput).toBeVisible();
    
    // Enter $5000
    await amountInput.fill('5000');
    console.log('Entered amount: $5000');
    
    // Verify currency is USD
    const currencySelect = page.locator('#topup-currency');
    const selectedCurrency = await currencySelect.inputValue();
    expect(selectedCurrency).toBe('USD');
    console.log(`Selected currency: ${selectedCurrency}`);

    // ========================================
    // PHASE 5: Submit Top-Up
    // ========================================
    console.log('Phase 5: Submitting top-up...');
    
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    
    // Wait for success message or redirect
    console.log('Waiting for top-up to process...');
    
    // Check for success message
    const successMessage = page.locator('text=/Successfully added|Success/i');
    const successVisible = await successMessage.isVisible({ timeout: 15000 }).catch(() => false);
    
    if (successVisible) {
      console.log('Top-up success message displayed');
    }
    
    // Wait for redirect to wallet page (happens after 3 seconds on success)
    await page.waitForURL('**/wallet', { timeout: 20000 }).catch(() => {
      console.log('Did not redirect to wallet - navigating manually');
      page.goto('/wallet');
    });

    // ========================================
    // PHASE 6: Verify Updated Wallet Balance
    // ========================================
    console.log('Phase 6: Verifying updated wallet balance...');
    
    await page.goto('/wallet');
    await walletBalanceLocator.waitFor({ state: 'visible', timeout: 30000 });
    
    const newBalanceText = await walletBalanceLocator.textContent();
    const newBalance = parseFloat(newBalanceText?.replace(/[^0-9.]/g, '') || '0');
    console.log(`New wallet balance: $${newBalance}`);
    
    // Verify balance increased by approximately $5000
    const expectedBalance = initialBalance + 5000;
    const balanceDifference = Math.abs(newBalance - expectedBalance);
    console.log(`Expected balance: $${expectedBalance}`);
    console.log(`Balance difference: $${balanceDifference}`);
    
    // Allow small difference due to rounding
    expect(balanceDifference).toBeLessThan(1);

    // ========================================
    // PHASE 7: Verify Dashboard Updated
    // ========================================
    console.log('Phase 7: Verifying dashboard shows updated balance...');
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const dashboardWalletCard = page.locator('div:has-text("Wallet snapshot")').first();
    await expect(dashboardWalletCard).toBeVisible();
    
    const updatedDashboardBalanceText = await dashboardWalletCard.locator('.font-medium').first().textContent();
    const updatedDashboardBalance = parseFloat(updatedDashboardBalanceText?.replace(/[^0-9.]/g, '') || '0');
    console.log(`Updated dashboard balance: $${updatedDashboardBalance}`);
    
    // Dashboard should now show balance increased by $5000
    const dashboardDifference = Math.abs(updatedDashboardBalance - expectedBalance);
    expect(dashboardDifference).toBeLessThan(1);
    
    console.log('✅ Wallet top-up test completed successfully!');
    console.log(`   Initial: $${initialBalance}`);
    console.log(`   Added: $5000`);
    console.log(`   Final: $${newBalance}`);
  });

  test('WT-002: Verify wallet balance persists across navigation', async ({ page }) => {
    console.log('Testing wallet balance persistence...');
    
    // Visit wallet page
    await page.goto('/wallet');
    await page.getByTestId('wallet-balance').waitFor({ state: 'visible', timeout: 30000 });
    const walletBalance1 = await page.getByTestId('wallet-balance').textContent();
    
    // Navigate to different pages
    await page.goto('/flights');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Return to wallet
    await page.goto('/wallet');
    await page.getByTestId('wallet-balance').waitFor({ state: 'visible', timeout: 30000 });
    const walletBalance2 = await page.getByTestId('wallet-balance').textContent();
    
    // Balance should be the same
    expect(walletBalance1).toBe(walletBalance2);
    console.log(`Balance persisted: ${walletBalance1}`);
  });

  test('WT-003: Top-up with different currencies', async ({ page }) => {
    console.log('Testing multi-currency top-up...');
    
    const currencies = [
      { code: 'USD', symbol: '$' },
      { code: 'EUR', symbol: '€' },
      { code: 'GBP', symbol: '£' },
    ];
    
    for (const currency of currencies) {
      console.log(`Testing ${currency.code} top-up...`);
      
      await page.goto('/wallet/topup');
      
      const amountInput = page.locator('#topup-amount');
      await amountInput.fill('100');
      
      const currencySelect = page.locator('#topup-currency');
      await currencySelect.selectOption(currency.code);
      
      const selectedValue = await currencySelect.inputValue();
      expect(selectedValue).toBe(currency.code);
      
      console.log(`✅ ${currency.code} top-up form ready`);
    }
  });
});