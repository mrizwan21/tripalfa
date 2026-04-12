import { tierService } from './tierService';
import { prisma } from '../database';

export interface TierUpdateResult {
  jobId: string;
  startedAt: Date;
  completedAt: Date | null;
  totalProcessed: number;
  successfulUpdates: number;
  failedUpdates: number;
  upgrades: number;
  downgrades: number;
  details: {
    customerId: string;
    oldTier: string | null;
    newTier: string;
    success: boolean;
    error?: string;
  }[];
}

export class TierUpdateJob {
  private jobId: string;
  private startedAt: Date;
  private completedAt: Date | null = null;
  private results: TierUpdateResult['details'] = [];
  private totalProcessed = 0;
  private successfulUpdates = 0;
  private failedUpdates = 0;
  private upgrades = 0;
  private downgrades = 0;

  constructor() {
    this.jobId = `tier-update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.startedAt = new Date();
  }

  /**
   * Run tier update for all eligible customers
   */
  async runFullUpdate(): Promise<TierUpdateResult> {
    console.log(`Starting tier update job ${this.jobId} at ${this.startedAt.toISOString()}`);

    try {
      // Get all eligible customers (excluding inactive ones)
      const customers = await prisma.crm_contact.findMany({
        where: {
          status: { in: ['lead', 'prospect', 'customer'] },
          OR: [
            { lastInteractionAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } }, // Active in last year
            { lastInteractionAt: null } // Or never had interaction (new leads)
          ]
        },
        select: {
          id: true,
          email: true,
          tier: true,
          totalSpent: true,
          bookingsCount: true,
          lastInteractionAt: true
        },
        orderBy: {
          lastInteractionAt: 'desc' // Process recently active customers first
        }
      });

      this.totalProcessed = customers.length;
      console.log(`Found ${this.totalProcessed} customers to process`);

      // Process in batches to avoid overwhelming the system
      const batchSize = 25;
      for (let i = 0; i < customers.length; i += batchSize) {
        const batch = customers.slice(i, i + batchSize);
        await this.processBatch(batch);
        
        // Log progress
        const progress = Math.round(((i + batch.length) / customers.length) * 100);
        console.log(`Progress: ${progress}% (${i + batch.length}/${customers.length})`);
      }

      this.completedAt = new Date();
      const duration = this.completedAt.getTime() - this.startedAt.getTime();
      
      console.log(`Tier update job ${this.jobId} completed in ${duration}ms`);
      console.log(`Results: ${this.successfulUpdates} successful, ${this.failedUpdates} failed`);
      console.log(`Tier changes: ${this.upgrades} upgrades, ${this.downgrades} downgrades`);

      return this.getResult();
    } catch (error: unknown) {
      console.error(`Tier update job ${this.jobId} failed:`, error);
      this.completedAt = new Date();
      throw error;
    }
  }

  /**
   * Run tier update for specific customers
   */
  async runUpdateForCustomers(customerIds: string[]): Promise<TierUpdateResult> {
    console.log(`Starting targeted tier update for ${customerIds.length} customers`);

    try {
      const customers = await prisma.crm_contact.findMany({
        where: {
          id: { in: customerIds }
        },
        select: {
          id: true,
          email: true,
          tier: true,
          totalSpent: true,
          bookingsCount: true,
          lastInteractionAt: true
        }
      });

      this.totalProcessed = customers.length;
      await this.processBatch(customers);

      this.completedAt = new Date();
      return this.getResult();
    } catch (error: unknown) {
      console.error('Targeted tier update failed:', error);
      this.completedAt = new Date();
      throw error;
    }
  }

  /**
   * Process a batch of customers
   */
  private async processBatch(customers: any[]): Promise<void> {
    const batchPromises = customers.map(async (customer) => {
      try {
        // Calculate new tier
        const tierScore = await tierService.calculateTierForCustomer(customer.id);
        
        // Determine if tier changed
        const oldTier = customer.tier;
        const newTier = tierScore.calculatedTier;
        const tierChanged = oldTier !== newTier;
        
        // Update tier in database if changed
        if (tierChanged) {
          await prisma.crm_contact.update({
            where: { id: customer.id },
            data: {
              tier: newTier,
              updatedAt: new Date()
            }
          });

          // Track upgrades/downgrades
          const oldTierLevel = tierService.getAllTierDefinitions().find(t => t.name === oldTier)?.level || 0;
          const newTierLevel = tierService.getAllTierDefinitions().find(t => t.name === newTier)?.level || 0;
          
          if (newTierLevel > oldTierLevel) {
            this.upgrades++;
          } else if (newTierLevel < oldTierLevel) {
            this.downgrades++;
          }
        }

        this.successfulUpdates++;
        this.results.push({
          customerId: customer.id,
          oldTier,
          newTier,
          success: true,
          ...(tierChanged && { 
            note: `Tier ${oldTier ? 'changed' : 'assigned'} from ${oldTier || 'none'} to ${newTier}` 
          })
        });

        return { success: true, customerId: customer.id, tierChanged };
      } catch (error: unknown) {
        console.error(`Failed to update tier for customer ${customer.id}:`, error);
        this.failedUpdates++;
        this.results.push({
          customerId: customer.id,
          oldTier: customer.tier,
          newTier: customer.tier, // Keep old tier on failure
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        return { success: false, customerId: customer.id, error };
      }
    });

    await Promise.all(batchPromises);
  }

  /**
   * Get the job result
   */
  private getResult(): TierUpdateResult {
    return {
      jobId: this.jobId,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      totalProcessed: this.totalProcessed,
      successfulUpdates: this.successfulUpdates,
      failedUpdates: this.failedUpdates,
      upgrades: this.upgrades,
      downgrades: this.downgrades,
      details: this.results
    };
  }

  /**
   * Schedule regular tier updates (e.g., daily, weekly)
   * This would typically be called from a cron job or scheduler
   */
  static async scheduleRegularUpdate(): Promise<void> {
    // In a real implementation, this would integrate with a job scheduler
    // For now, we'll just log the scheduling
    console.log('Scheduling regular tier updates...');
    
    // Example schedule: Run daily at 2 AM
    // In production, you would use node-cron, agenda, bull, or similar
    /*
    const cron = require('node-cron');
    cron.schedule('0 2 * * *', async () => {
      console.log('Running scheduled tier update...');
      const job = new TierUpdateJob();
      await job.runFullUpdate();
    });
    */
  }

  /**
   * Trigger tier update when customer data changes
   * This can be called from webhooks or after significant events
   */
  static async triggerUpdateForCustomer(customerId: string, reason?: string): Promise<boolean> {
    console.log(`Triggering tier update for customer ${customerId}${reason ? ` (${reason})` : ''}`);
    
    try {
      const job = new TierUpdateJob();
      await job.runUpdateForCustomers([customerId]);
      const result = job.getResult();
      
      return result.successfulUpdates > 0 && result.failedUpdates === 0;
    } catch (error: unknown) {
      console.error(`Failed to trigger tier update for customer ${customerId}:`, error);
      return false;
    }
  }

  /**
   * Get job status by ID (for monitoring)
   */
  static getJobStatus(jobId: string): TierUpdateResult | null {
    // In a real implementation, this would fetch from a database or cache
    // For now, return null as we don't have persistence
    return null;
  }
}

// Export singleton instance for scheduled jobs
const tierUpdateJob = new TierUpdateJob();