import { prisma } from '../database';

export interface TierCriteria {
  minTotalSpent: number;
  minBookingsCount: number;
  minEngagementScore: number; // 0-100 based on activities, lead score, etc.
  requiredStatus?: string[]; // Optional status requirements
}

export interface TierDefinition {
  name: string;
  level: number; // 1-4 where 4 is highest (platinum)
  criteria: TierCriteria;
  benefits: string[];
  color: string; // For UI display
}

export interface CustomerTierScore {
  customerId: string;
  email: string;
  currentTier: string | null;
  calculatedTier: string;
  score: number; // 0-100 overall score
  metrics: {
    totalSpent: number;
    bookingsCount: number;
    engagementScore: number;
    daysSinceLastInteraction: number;
    openTicketsCount: number;
  };
  meetsCriteria: {
    [key: string]: boolean;
  };
  upgradeEligible: boolean;
  downgradeRisk: boolean;
}

class TierService {
  // Tier definitions - can be configured via database or environment variables
  private static readonly TIER_DEFINITIONS: TierDefinition[] = [
    {
      name: 'platinum',
      level: 4,
      criteria: {
        minTotalSpent: 50000,
        minBookingsCount: 10,
        minEngagementScore: 80,
        requiredStatus: ['customer'],
      },
      benefits: [
        'Priority support',
        'Dedicated account manager',
        'Exclusive deals and offers',
        'Early access to new features',
        'Highest commission rates',
      ],
      color: '#e5e4e2', // Platinum color
    },
    {
      name: 'gold',
      level: 3,
      criteria: {
        minTotalSpent: 20000,
        minBookingsCount: 5,
        minEngagementScore: 60,
        requiredStatus: ['customer', 'prospect'],
      },
      benefits: [
        'Faster support response',
        'Personalized recommendations',
        'Special promotional rates',
        'Quarterly business reviews',
      ],
      color: '#ffd700', // Gold color
    },
    {
      name: 'silver',
      level: 2,
      criteria: {
        minTotalSpent: 5000,
        minBookingsCount: 2,
        minEngagementScore: 40,
      },
      benefits: ['Standard support', 'Monthly newsletter', 'Occasional promotions'],
      color: '#c0c0c0', // Silver color
    },
    {
      name: 'bronze',
      level: 1,
      criteria: {
        minTotalSpent: 0,
        minBookingsCount: 0,
        minEngagementScore: 0,
      },
      benefits: ['Basic support', 'Access to platform'],
      color: '#cd7f32', // Bronze color
    },
  ];

  /**
   * Calculate engagement score for a customer (0-100)
   * Based on: lead score, activity frequency, recency of interaction, etc.
   */
  private async calculateEngagementScore(contactId: string): Promise<number> {
    try {
      const [contact, leadScore, recentActivities] = await Promise.all([
        prisma.crm_contact.findUnique({
          where: { id: contactId },
          select: {
            lastInteractionAt: true,
            openTicketsCount: true,
          },
        }),
        prisma.crm_lead_score.findUnique({
          where: { contactId },
          select: {
            score: true,
            lastEngagementDate: true,
            pageViews: true,
            emailsReceived: true,
          },
        }),
        prisma.crm_activity.findMany({
          where: {
            contactId,
            completedAt: {
              not: null,
            },
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
            },
          },
          select: {
            activityType: true,
            completedAt: true,
          },
        }),
      ]);

      let score = 50; // Base score

      // Factor 1: Lead score (if exists)
      if (leadScore?.score) {
        score += (leadScore.score - 50) * 0.3; // Lead score contributes 30%
      }

      // Factor 2: Recent activities
      const activityCount = recentActivities.length;
      if (activityCount > 0) {
        const activityScore = Math.min(activityCount * 5, 20); // Max 20 points for activities
        score += activityScore;
      }

      // Factor 3: Recency of interaction
      if (contact?.lastInteractionAt) {
        const daysSinceInteraction = Math.floor(
          (Date.now() - contact.lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceInteraction <= 7) score += 15;
        else if (daysSinceInteraction <= 30) score += 10;
        else if (daysSinceInteraction <= 90) score += 5;
        else score -= 10; // Penalty for very old interaction
      }

      // Factor 4: Open tickets (negative impact)
      if (contact?.openTicketsCount && contact.openTicketsCount > 0) {
        score -= Math.min(contact.openTicketsCount * 5, 15);
      }

      // Factor 5: Page views and emails (from lead score)
      if (leadScore) {
        if (leadScore.pageViews > 0) {
          score += Math.min(leadScore.pageViews / 10, 10);
        }
        if (leadScore.emailsReceived > 0) {
          score += Math.min(leadScore.emailsReceived, 5);
        }
      }

      // Ensure score is between 0 and 100
      return Math.max(0, Math.min(100, Math.round(score)));
    } catch (error: unknown) {
      console.error(`Error calculating engagement score for contact ${contactId}:`, error);
      return 50; // Default score on error
    }
  }

  /**
   * Calculate the appropriate tier for a customer based on their metrics
   */
  async calculateTierForCustomer(contactId: string): Promise<CustomerTierScore> {
    try {
      const contact = await prisma.crm_contact.findUnique({
        where: { id: contactId },
        include: {
          leadScore: true,
        },
      });

      if (!contact) {
        throw new Error(`Contact with ID ${contactId} not found`);
      }

      // Calculate engagement score
      const engagementScore = await this.calculateEngagementScore(contactId);

      // Calculate days since last interaction
      const daysSinceLastInteraction = contact.lastInteractionAt
        ? Math.floor((Date.now() - contact.lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24))
        : 999; // Large number if no interaction

      // Prepare metrics
      const metrics = {
        totalSpent: Number(contact.totalSpent) || 0,
        bookingsCount: contact.bookingsCount || 0,
        engagementScore,
        daysSinceLastInteraction,
        openTicketsCount: contact.openTicketsCount || 0,
      };

      // Calculate overall score (weighted)
      const overallScore =
        (metrics.totalSpent / 100000) * 40 + // 40% weight for spending (up to $100k)
        (Math.min(metrics.bookingsCount, 20) / 20) * 30 + // 30% weight for bookings (max 20)
        (metrics.engagementScore / 100) * 30; // 30% weight for engagement

      // Determine which tier the customer qualifies for
      let calculatedTier = 'bronze';
      const meetsCriteria: { [key: string]: boolean } = {};

      // Check from highest to lowest tier
      for (const tierDef of TierService.TIER_DEFINITIONS.sort((a, b) => b.level - a.level)) {
        const criteria = tierDef.criteria;

        // Check status requirements if specified
        if (criteria.requiredStatus && !criteria.requiredStatus.includes(contact.status)) {
          meetsCriteria[tierDef.name] = false;
          continue;
        }

        // Check financial and engagement criteria
        const meetsFinancial = metrics.totalSpent >= criteria.minTotalSpent;
        const meetsBookings = metrics.bookingsCount >= criteria.minBookingsCount;
        const meetsEngagement = metrics.engagementScore >= criteria.minEngagementScore;

        const qualifies = meetsFinancial && meetsBookings && meetsEngagement;
        meetsCriteria[tierDef.name] = qualifies;

        if (qualifies) {
          calculatedTier = tierDef.name;
          break;
        }
      }

      // Determine if customer is eligible for upgrade
      const currentTierLevel =
        TierService.TIER_DEFINITIONS.find(t => t.name === contact.tier)?.level || 0;
      const calculatedTierLevel =
        TierService.TIER_DEFINITIONS.find(t => t.name === calculatedTier)?.level || 0;
      const upgradeEligible = calculatedTierLevel > currentTierLevel;

      // Determine if customer is at risk of downgrade
      const downgradeRisk = Boolean(
        contact.tier &&
        contact.tier !== 'bronze' &&
        calculatedTierLevel < currentTierLevel &&
        metrics.daysSinceLastInteraction > 90
      );

      return {
        customerId: contact.id,
        email: contact.email,
        currentTier: contact.tier,
        calculatedTier,
        score: Math.min(100, Math.round(overallScore)),
        metrics,
        meetsCriteria,
        upgradeEligible,
        downgradeRisk,
      };
    } catch (error: unknown) {
      console.error(`Error calculating tier for contact ${contactId}:`, error);
      throw error;
    }
  }

  /**
   * Update a customer's tier in the database
   */
  async updateCustomerTier(contactId: string, tier?: string): Promise<boolean> {
    try {
      // If tier not provided, calculate it
      const targetTier = tier || (await this.calculateTierForCustomer(contactId)).calculatedTier;

      await prisma.crm_contact.update({
        where: { id: contactId },
        data: {
          tier: targetTier,
          updatedAt: new Date(),
        },
      });

      console.log(`Updated tier for contact ${contactId} to ${targetTier}`);
      return true;
    } catch (error: unknown) {
      console.error(`Error updating tier for contact ${contactId}:`, error);
      return false;
    }
  }

  /**
   * Batch update tiers for multiple customers
   */
  async batchUpdateTiers(contactIds?: string[]): Promise<{ success: number; failed: number }> {
    try {
      // Get contacts to update
      const whereCondition = contactIds
        ? { id: { in: contactIds } }
        : { status: { in: ['lead', 'prospect', 'customer'] } };

      const contacts = await prisma.crm_contact.findMany({
        where: whereCondition,
        select: { id: true },
      });

      const results = { success: 0, failed: 0 };

      // Process in batches to avoid overwhelming the database
      const batchSize = 50;
      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);

        const batchPromises = batch.map(async (contact: { id: string }) => {
          try {
            const tierScore = await this.calculateTierForCustomer(contact.id);
            await this.updateCustomerTier(contact.id, tierScore.calculatedTier);
            results.success++;
          } catch (error: unknown) {
            console.error(`Failed to update tier for contact ${contact.id}:`, error);
            results.failed++;
          }
        });

        await Promise.all(batchPromises);
      }

      console.log(
        `Batch tier update completed: ${results.success} succeeded, ${results.failed} failed`
      );
      return results;
    } catch (error: unknown) {
      console.error('Error in batch tier update:', error);
      return { success: 0, failed: 0 };
    }
  }

  /**
   * Get tier statistics across all customers
   */
  async getTierStatistics(): Promise<{
    distribution: { tier: string; count: number; percentage: number }[];
    averageMetrics: { [key: string]: number };
    upgradeOpportunities: number;
    downgradeRisks: number;
  }> {
    try {
      // Get tier distribution
      const tierDistribution = await prisma.crm_contact.groupBy({
        by: ['tier'],
        _count: {
          id: true,
        },
        where: {
          tier: {
            not: null,
          },
        },
      });

      const totalCustomers = tierDistribution.reduce((sum: number, item: any) => sum + item._count.id, 0);

      const distribution = tierDistribution.map((item: any) => ({
        tier: item.tier || 'unknown',
        count: item._count.id,
        percentage: totalCustomers > 0 ? Math.round((item._count.id / totalCustomers) * 100) : 0,
      }));

      // Get average metrics
      const avgMetrics = await prisma.crm_contact.aggregate({
        _avg: {
          totalSpent: true,
          bookingsCount: true,
          openTicketsCount: true,
        },
        where: {
          status: { in: ['customer', 'prospect'] },
        },
      });

      // Count upgrade opportunities and downgrade risks (simplified)
      // In a real implementation, you'd want to calculate these properly
      const upgradeOpportunities = await prisma.crm_contact.count({
        where: {
          tier: { in: ['bronze', 'silver', 'gold'] },
          totalSpent: { gt: 1000 },
          lastInteractionAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      const downgradeRisks = await prisma.crm_contact.count({
        where: {
          tier: { in: ['platinum', 'gold', 'silver'] },
          lastInteractionAt: {
            lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
        },
      });

      return {
        distribution,
        averageMetrics: {
          totalSpent: Number(avgMetrics._avg.totalSpent) || 0,
          bookingsCount: avgMetrics._avg.bookingsCount || 0,
          openTicketsCount: avgMetrics._avg.openTicketsCount || 0,
        },
        upgradeOpportunities,
        downgradeRisks,
      };
    } catch (error: unknown) {
      console.error('Error getting tier statistics:', error);
      throw error;
    }
  }

  /**
   * Get tier definition by name
   */
  getTierDefinition(tierName: string): TierDefinition | undefined {
    return TierService.TIER_DEFINITIONS.find(t => t.name === tierName);
  }

  /**
   * Get all tier definitions
   */
  getAllTierDefinitions(): TierDefinition[] {
    return [...TierService.TIER_DEFINITIONS];
  }
}

// Export singleton instance
export const tierService = new TierService();
