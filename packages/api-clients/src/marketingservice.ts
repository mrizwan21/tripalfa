import axios from 'axios';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed';
  targetAudience: string[];
  startDate: string;
  endDate?: string;
  budget?: number;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
  };
}

export class MarketingService {
  private static baseURL = process.env.VITE_ORGANIZATION_SERVICE_URL || process.env.VITE_API_GATEWAY_URL || 'http://localhost:3006';

  /**
   * Get all campaigns
   */
  static async getCampaigns(): Promise<Campaign[]> {
    try {
      const response = await axios.get<Campaign[]>(
        `${this.baseURL}/api/marketing/campaigns`
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get campaigns: ${error}`);
    }
  }

  /**
   * Create a new campaign
   */
  static async createCampaign(campaign: Omit<Campaign, 'id' | 'metrics'>): Promise<Campaign> {
    try {
      const response = await axios.post<Campaign>(
        `${this.baseURL}/api/marketing/campaigns`,
        campaign
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to create campaign: ${error}`);
    }
  }

  /**
   * Update campaign status
   */
  static async updateCampaignStatus(campaignId: string, status: Campaign['status']): Promise<Campaign> {
    try {
      const response = await axios.put<Campaign>(
        `${this.baseURL}/api/marketing/campaigns/${campaignId}`,
        { status }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to update campaign status: ${error}`);
    }
  }
}

export default MarketingService;