import { getPrismaClient } from '../database';
import type { CreateContact, UpdateContact, CreateActivity, UpdatePreference } from '../types';

const prisma = getPrismaClient();

class ContactService {
  /**
   * Sync or create contact from user
   */
  async syncOrCreateContact(userId: string, email: string, firstName?: string, lastName?: string) {
    try {
      const contact = await prisma.contact.upsert({
        where: { userId },
        create: {
          userId,
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        },
        update: {
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          updatedAt: new Date(),
        },
        include: {
          preferences: true,
          comments: true,
        },
      });
      return { success: true, contact };
    } catch (error: unknown) {
      console.error('Error syncing contact:', error);
      throw error;
    }
  }

  /**
   * Get contact by ID
   */
  async getContact(contactId: string) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        include: {
          activities: {
            take: 20,
            orderBy: { createdAt: 'desc' },
          },
          preferences: true,
          comments: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      return contact;
    } catch (error: unknown) {
      console.error('Error fetching contact:', error);
      throw error;
    }
  }

  /**
   * Get contact by email
   */
  async getContactByEmail(email: string) {
    try {
      return await prisma.contact.findFirst({
        where: { email },
        include: {
          preferences: true,
          activities: {
            take: 20,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    } catch (error: unknown) {
      console.error('Error fetching contact by email:', error);
      throw error;
    }
  }

  /**
   * Update contact
   */
  async updateContact(contactId: string, data: UpdateContact) {
    try {
      const contact = await prisma.contact.update({
        where: { id: contactId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          preferences: true,
        },
      });
      return contact;
    } catch (error: unknown) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  /**
   * Update contact tier based on total spent
   */
  async updateTierBySpending(contactId: string, totalSpent: number) {
    let tier = 'STANDARD';
    if (totalSpent >= 10000) tier = 'PLATINUM';
    else if (totalSpent >= 5000) tier = 'GOLD';
    else if (totalSpent >= 1000) tier = 'SILVER';

    return await prisma.contact.update({
      where: { id: contactId },
      data: { tier: tier as any, totalSpent },
    });
  }

  /**
   * Batch update contact metrics
   */
  async updateContactMetrics(
    contactId: string,
    metrics: {
      bookingsCount?: number;
      totalSpent?: number;
      openTicketsCount?: number;
    }
  ) {
    try {
      return await prisma.contact.update({
        where: { id: contactId },
        data: {
          ...metrics,
          updatedAt: new Date(),
        },
      });
    } catch (error: unknown) {
      console.error('Error updating contact metrics:', error);
      throw error;
    }
  }

  /**
   * Add note to contact
   */
  async addNote(contactId: string, content: string, createdBy: string, isInternal: boolean = true) {
    try {
      return await prisma.contact_comment.create({
        data: {
          contactId,
          content,
          createdBy,
          isInternal,
        },
      });
    } catch (error: unknown) {
      console.error('Error adding note:', error);
      throw error;
    }
  }

  /**
   * List contacts with filtering
   */
  async listContacts(
    filters: {
      tier?: string;
      sortBy?: 'createdAt' | 'totalSpent' | 'bookingsCount';
      order?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const { tier, sortBy = 'createdAt', order = 'desc', limit = 20, offset = 0 } = filters;

      const where: any = {};
      if (tier) where.tier = tier;

      const contacts = await prisma.contact.findMany({
        where,
        include: {
          preferences: true,
        },
        orderBy: { [sortBy]: order },
        take: limit,
        skip: offset,
      });

      const total = await prisma.contact.count({ where });

      return {
        data: contacts,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: unknown) {
      console.error('Error listing contacts:', error);
      throw error;
    }
  }

  /**
   * Get contact summary (for dashboard)
   */
  async getContactSummary(contactId: string) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
      });

      if (!contact) return null;

      const [totalActivities, recentActivities, comments] = await Promise.all([
        prisma.activity.count({
          where: { contactId },
        }),
        prisma.activity.findMany({
          where: { contactId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.contact_comment.count({
          where: { contactId },
        }),
      ]);

      return {
        contact,
        totalActivities,
        recentActivities,
        totalNotes: comments,
      };
    } catch (error: unknown) {
      console.error('Error getting contact summary:', error);
      throw error;
    }
  }

  /**
   * Update preference
   */
  async updatePreference(contactId: string, data: UpdatePreference) {
    try {
      return await prisma.contact_preference.upsert({
        where: { contactId },
        create: {
          contactId,
          ...data,
        },
        update: {
          ...data,
          updatedAt: new Date(),
        },
      });
    } catch (error: unknown) {
      console.error('Error updating preference:', error);
      throw error;
    }
  }

  /**
   * Get contacts by tier
   */
  async getContactsByTier(tier: string, limit: number = 50) {
    try {
      return await prisma.contact.findMany({
        where: { tier: tier as any },
        include: {
          preferences: true,
        },
        orderBy: { totalSpent: 'desc' },
        take: limit,
      });
    } catch (error: unknown) {
      console.error('Error fetching contacts by tier:', error);
      throw error;
    }
  }
}

export const contactService = new ContactService();
