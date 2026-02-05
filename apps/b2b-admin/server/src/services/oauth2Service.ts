import crypto from 'crypto';
import axios from 'axios';

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuth2Tokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified?: boolean;
}

export class OAuth2Service {
  private config: OAuth2Config;

  constructor(config: OAuth2Config) {
    this.config = config;
  }

  /**
   * Generate authorization URL for OAuth2 flow
   */
  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      response_type: 'code',
      state: state || crypto.randomBytes(16).toString('hex'),
      access_type: 'offline',
      prompt: 'consent'
    });

    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<OAuth2Tokens> {
    try {
      const response = await axios.post(this.config.tokenUrl, {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type
      };
    } catch (error) {
      console.error('OAuth2 token exchange failed:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuth2Tokens> {
    try {
      const response = await axios.post(this.config.tokenUrl, {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || refreshToken,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type
      };
    } catch (error) {
      console.error('OAuth2 token refresh failed:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get user information from OAuth2 provider
   */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    try {
      const response = await axios.get(this.config.userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return {
        id: response.data.id || response.data.sub,
        email: response.data.email,
        name: response.data.name || `${response.data.given_name} ${response.data.family_name}`,
        picture: response.data.picture,
        emailVerified: response.data.email_verified || false
      };
    } catch (error) {
      console.error('OAuth2 user info retrieval failed:', error);
      throw new Error('Failed to retrieve user information');
    }
  }

  /**
   * Revoke OAuth2 tokens
   */
  async revokeToken(token: string, tokenType: string = 'access_token'): Promise<void> {
    try {
      await axios.post('https://oauth2.googleapis.com/revoke', {
        token,
        token_type_hint: tokenType
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    } catch (error) {
      console.error('OAuth2 token revocation failed:', error);
      throw new Error('Failed to revoke token');
    }
  }

  /**
   * Validate OAuth2 state parameter
   */
  validateState(receivedState: string, expectedState: string): boolean {
    return receivedState === expectedState;
  }

  /**
   * Generate PKCE parameters for OAuth2 flow
   */
  generatePKCEParameters(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    
    return { codeVerifier, codeChallenge };
  }
}

// Google OAuth2 Configuration
export const GoogleOAuth2Config: OAuth2Config = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
  scopes: ['openid', 'profile', 'email']
};

// Microsoft OAuth2 Configuration
export const MicrosoftOAuth2Config: OAuth2Config = {
  clientId: process.env.MICROSOFT_CLIENT_ID || '',
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
  authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  userInfoUrl: 'https://graph.microsoft.com/oidc/userinfo',
  redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/auth/microsoft/callback',
  scopes: ['openid', 'profile', 'email', 'User.Read']
};

// OAuth2 Provider Factory
export class OAuth2ProviderFactory {
  static createGoogleProvider(): OAuth2Service {
    if (!GoogleOAuth2Config.clientId || !GoogleOAuth2Config.clientSecret) {
      throw new Error('Google OAuth2 credentials not configured');
    }
    return new OAuth2Service(GoogleOAuth2Config);
  }

  static createMicrosoftProvider(): OAuth2Service {
    if (!MicrosoftOAuth2Config.clientId || !MicrosoftOAuth2Config.clientSecret) {
      throw new Error('Microsoft OAuth2 credentials not configured');
    }
    return new OAuth2Service(MicrosoftOAuth2Config);
  }

  static createProvider(provider: 'google' | 'microsoft'): OAuth2Service {
    switch (provider) {
      case 'google':
        return this.createGoogleProvider();
      case 'microsoft':
        return this.createMicrosoftProvider();
      default:
        throw new Error(`Unsupported OAuth2 provider: ${provider}`);
    }
  }
}

export default OAuth2Service;