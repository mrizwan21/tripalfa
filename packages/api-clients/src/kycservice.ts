import axios from "axios";

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
  private static baseURL =
    process.env.VITE_API_BASE_URL || "http://localhost:3000";

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
      throw new Error(`Failed to submit KYC verification: ${error}`);
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
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to get KYC status: ${error}`);
    }
  }

  /**
   * Approve KYC verification
   */
  static async approveVerification(
    userId: string,
    status: string = "verified",
  ): Promise<KYCVerification> {
    try {
      const response = await axios.put<KYCVerification>(
        `${this.baseURL}/api/kyc/verify/${userId}`,
        { status },
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to approve KYC verification: ${error}`);
    }
  }
}

export default KYCService;
