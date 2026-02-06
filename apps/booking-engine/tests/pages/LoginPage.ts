import { BasePage } from './BasePage';
import { expect } from '@playwright/test';

export class LoginPage extends BasePage {
  async login(email: string, password: string) {
    try {
      console.log(`Attempting login for user: ${email}`);
      
      // Wait for login form to be visible
      await expect(this.getByTestId('login-form')).toBeVisible({ timeout: 10000 });
      
      // Use 'force: true' to interact with hidden elements
      await this.getByTestId('login-email').fill(email, { force: true });
      await this.getByTestId('login-password').fill(password, { force: true });
      await this.getByTestId('login-submit').click({ force: true });
      
      // Wait for successful navigation with more specific conditions
      await this.page.waitForURL(/\/(dashboard|flights|hotels)/, { timeout: 45000 });
      await expect(this.page).toHaveURL(/\/(dashboard|flights|hotels)/);
      
      // Verify we're actually logged in by checking for user-specific elements
      await expect(this.page.getByTestId('user-menu')).toBeVisible({ timeout: 5000 });
      
      console.log(`Login successful for user: ${email}`);
    } catch (error) {
      console.error(`Login failed for user ${email}:`, error);
      
      // Try alternative login method if primary fails
      if (error instanceof Error && error.message.includes('timeout')) {
        await this.handleLoginTimeout(email, password);
      }
      
      throw error;
    }
  }

  async handleLoginTimeout(email: string, password: string) {
    console.log('Attempting alternative login method due to timeout...');
    
    // Clear any existing inputs
    await this.getByTestId('login-email').clear({ force: true });
    await this.getByTestId('login-password').clear({ force: true });
    
    // Try with slower typing to avoid timing issues
    await this.getByTestId('login-email').type(email, { delay: 100 });
    await this.getByTestId('login-password').type(password, { delay: 100 });
    
    // Wait a bit before clicking submit
    await this.page.waitForTimeout(1000);
    await this.getByTestId('login-submit').click({ force: true });
    
    // Wait for navigation with extended timeout
    await this.page.waitForURL(/\/(dashboard|flights|hotels)/, { timeout: 60000 });
    await expect(this.page).toHaveURL(/\/(dashboard|flights|hotels)/);
  }

  async loginWithRetry(email: string, password: string, maxRetries: number = 2) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Login attempt ${attempt} for user: ${email}`);
        await this.login(email, password);
        return; // Success, exit retry loop
      } catch (error) {
        if (attempt === maxRetries) {
          console.error(`Login failed after ${maxRetries} attempts for user: ${email}`);
          throw error;
        }
        
        console.log(`Login attempt ${attempt} failed, retrying in 2 seconds...`);
        await this.page.waitForTimeout(2000); // Wait before retry
        
        // Navigate back to login page if needed
        if (!this.page.url().includes('/login')) {
          await this.page.goto('/login');
          await expect(this.getByTestId('login-form')).toBeVisible({ timeout: 10000 });
        }
      }
    }
  }

  async isAlreadyLoggedIn(): Promise<boolean> {
    try {
      // Check if we're already on a logged-in page
      await this.page.waitForURL(/\/(dashboard|flights|hotels)/, { timeout: 5000 });
      await expect(this.page.getByTestId('user-menu')).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
