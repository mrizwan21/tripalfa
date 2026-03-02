// Standalone auth helpers for E2E tests
// Avoids importing from booking-service which has compilation issues

let session: { token?: string } = {};

/**
 * Creates a mock JWT token for testing
 * In real scenarios, this would come from the login API
 */
function createMockToken(userId: string, role: string, email: string): string {
  // Simple mock token format - in real tests, use actual API login
  const payload = btoa(
    JSON.stringify({ userId, role, email, iat: Date.now() }),
  );
  return `mock.${payload}.signature`;
}

export function loginAsUser(user: { email: string; role: string }) {
  // Use email as userId for test, and pass role/email
  session.token = createMockToken(user.email, user.role, user.email);
  return session.token;
}

export function getAuthToken() {
  return session.token;
}

export function logout() {
  session = {};
}
