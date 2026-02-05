import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export interface MfaSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MfaVerification {
  success: boolean;
  backupCodeUsed?: boolean;
  remainingBackupCodes?: number;
}

export class MultiFactorAuthService {
  private static readonly BACKUP_CODE_LENGTH = 8;
  private static readonly BACKUP_CODE_COUNT = 10;

  /**
   * Generate MFA setup for a user
   */
  static async generateSetup(userId: string, userEmail: string): Promise<MfaSetup> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `TripAlfa (${userEmail})`,
        issuer: 'TripAlfa',
        length: 32
      });

      // Generate QR code URL
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      return {
        secret: secret.base32!,
        qrCodeUrl,
        backupCodes
      };
    } catch (error) {
      console.error('MFA setup generation failed:', error);
      throw new Error('Failed to generate MFA setup');
    }
  }

  /**
   * Verify MFA token
   */
  static verifyToken(token: string, secret: string, backupCodes?: string[]): MfaVerification {
    try {
      // Try TOTP verification first
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2 // Allow 2 time steps tolerance
      });

      if (verified) {
        return { success: true };
      }

      // Try backup codes if provided
      if (backupCodes && backupCodes.length > 0) {
        const backupCodeIndex = backupCodes.findIndex(code => 
          code.toLowerCase() === token.toLowerCase()
        );

        if (backupCodeIndex !== -1) {
          // Remove used backup code
          backupCodes.splice(backupCodeIndex, 1);
          
          return {
            success: true,
            backupCodeUsed: true,
            remainingBackupCodes: backupCodes.length
          };
        }
      }

      return { success: false };
    } catch (error) {
      console.error('MFA verification failed:', error);
      return { success: false };
    }
  }

  /**
   * Generate backup codes
   */
  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      const code = crypto.randomBytes(this.BACKUP_CODE_LENGTH)
        .toString('hex')
        .toUpperCase()
        .slice(0, this.BACKUP_CODE_LENGTH);
      
      codes.push(code);
    }

    return codes;
  }

  /**
   * Regenerate backup codes
   */
  static regenerateBackupCodes(): string[] {
    return this.generateBackupCodes();
  }

  /**
   * Validate backup code format
   */
  static validateBackupCode(code: string): boolean {
    return /^[A-F0-9]{8}$/i.test(code) && code.length === this.BACKUP_CODE_LENGTH;
  }

  /**
   * Check if user has remaining backup codes
   */
  static hasRemainingBackupCodes(backupCodes: string[]): boolean {
    return backupCodes.length > 0;
  }

  /**
   * Encrypt backup codes for storage
   */
  static encryptBackupCodes(backupCodes: string[], encryptionKey: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = (crypto as any).createCipher(algorithm, key);
    
    let encrypted = cipher.update(JSON.stringify(backupCodes), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt backup codes from storage
   */
  static decryptBackupCodes(encryptedCodes: string, encryptionKey: string): string[] {
    const textParts = encryptedCodes.split(':');
    const iv = crypto.randomBytes(16);
    iv.fill(textParts[0], 'hex');
    const encryptedText = textParts[1];
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(encryptionKey, 'salt', 32);
    const decipher = (crypto as any).createDecipher(algorithm, key);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
}

export default MultiFactorAuthService;