import axios from "axios";
import { getEnv } from "./env.js";
import { getErrorMessage } from "./utils.js";

export interface KYCVerification {
  id: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  documents: string[];
  submittedAt: string;
  reviewedAt?: string;
  reviewerNotes?: string;
}

export class KYCService {
  /**
   * Get base URL for KYC service - uses lazy evaluation to support runtime config changes
   */
  private static get baseURL(): string {
    // Try KYC-specific URL first, fall back to API base URL
    const kycUrl = getEnv("VITE_KYC_SERVICE_URL", "");
    if (kycUrl) return kycUrl;
    
    return getEnv("VITE_API_BASE_URL", "http://localhost:3000");
  }

  /**
   * Submit KYC verification
   */
  static async submitVerification(
    userId: string,
    documents: string[],
  ): Promise<KYCVerification> {
    try {
      const response = await axios.post<KYCVerification>(
        `${this.baseURL}/api/kyc/submit`,
        { userId, documents },
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to submit KYC verification: ${message}`, { cause: error });
    }
  }

  /**
   * Get KYC status for user
   */
  static async getVerificationStatus(
    userId: string,
  ): Promise<KYCVerification | null> {
    try {
      const response = await axios.get<KYCVerification>(
        `${this.baseURL}/api/kyc/status/${userId}`,
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      const message = getErrorMessage(error);
      throw new Error(`Failed to get KYC status: ${message}`, { cause: error });
    }
  }

  /**
   * Approve KYC verification
   * @deprecated Use "approved" or "rejected" instead of "verified". The "verified" value is kept for backward compatibility only.
   */
  static async approveVerification(
    userId: string,
    status: "approved" | "rejected" | "verified" = "approved",
  ): Promise<KYCVerification> {
    try {
      // Map deprecated "verified" to "approved" for backward compatibility
      const normalizedStatus = status === "verified" ? "approved" : status;
      
      const response = await axios.put<KYCVerification>(
        `${this.baseURL}/api/kyc/verify/${userId}`,
        { status: normalizedStatus },
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to approve KYC verification: ${message}`, { cause: error });
    }
  }
}

export default KYCService;
