import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_ISSUER = process.env.JWT_ISSUER || 'tripalfa';
const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRY = '7d';  // Long-lived refresh token

class TokenService {
  private static instance: TokenService;

  static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  async generateAccessToken(payload: any): Promise<string> {
    return jwt.sign(
      {
        ...payload,
        sub: payload.id || payload.sub,
      },
      JWT_SECRET,
      { 
        issuer: JWT_ISSUER, 
        expiresIn: ACCESS_TOKEN_EXPIRY 
      }
    );
  }

  async generateRefreshToken(userId: string): Promise<string> {
    return jwt.sign(
      { sub: userId, type: 'refresh' },
      JWT_SECRET,
      { 
        issuer: JWT_ISSUER, 
        expiresIn: REFRESH_TOKEN_EXPIRY 
      }
    );
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

export const tokenService = TokenService.getInstance();
