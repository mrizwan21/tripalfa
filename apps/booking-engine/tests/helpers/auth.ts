
import { createAuthToken } from '../../../../services/booking-service/src/__tests__/integration/utils';

let session: { token?: string } = {};

export function loginAsUser(user: { email: string, role: string }) {
  // Use email as userId for test, and pass role/email
  session.token = createAuthToken(user.email, user.role, user.email);
  return session.token;
}

export function getAuthToken() {
  return session.token;
}

export function logout() {
  session = {};
}
