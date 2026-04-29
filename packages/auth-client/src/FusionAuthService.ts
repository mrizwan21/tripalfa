import axios from 'axios';
import { encryptData, decryptData } from './encryption';

export class FusionAuthService {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: { baseUrl: string; apiKey: string }) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  async login(email: string, password: string) {
    const response = await axios.post(`${this.baseUrl}/api/login`, {
      loginId: email,
      password,
      applicationId: process.env.FUSIONAUTH_APP_ID
    }, {
      headers: { Authorization: this.apiKey }
    });
    
    return {
      token: encryptData(response.data.token),
      tenantId: response.data.tenantId,
      roles: response.data.roles,
      isAdmin: response.data.isAdmin
    };
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tenantId: string;
    roles: string[];
  }) {
    const response = await axios.post(`${this.baseUrl}/api/user/registration`, {
      registration: {
        applicationId: process.env.FUSIONAUTH_APP_ID,
        roles: userData.roles
      },
      user: {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        tenantId: userData.tenantId
      }
    }, {
      headers: { Authorization: this.apiKey }
    });

    return response.data;
  }

  async resetPassword(email: string) {
    return axios.post(`${this.baseUrl}/api/user/forgot-password`, {
      loginId: email,
      applicationId: process.env.FUSIONAUTH_APP_ID
    }, {
      headers: { Authorization: this.apiKey }
    });
  }
}