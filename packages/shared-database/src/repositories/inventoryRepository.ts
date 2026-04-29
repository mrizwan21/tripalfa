/**
 * Inventory Repository
 * Handles all inventory-related data access for flight and hotel blocks.
 */

import { InventoryBlock, InventoryTransaction, Prisma, InventoryStatus, InventoryTransactionType, InventoryType, Booking } from '../../generated/prisma-client';
import { getBookingDb } from '../index';

export interface CreateInventoryBlockInput {
  type: InventoryType;
  provider: string;
  reference: string;
  totalQuantity: number;
  costPerUnit: number;
  sellPricePerUnit: number;
  expiryDate: string | Date;
  status?: InventoryStatus;
}

/**
 * Finds all inventory blocks for a tenant
 */
export async function findInventoryBlocks(tenantId?: string): Promise<InventoryBlock[]> {
  const db = getBookingDb();
  return db.inventoryBlock.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Finds a specific inventory block by ID
 */
export async function findInventoryBlockById(id: string, tx?: Prisma.TransactionClient): Promise<InventoryBlock | null> {
  const client = tx || getBookingDb();
  return client.inventoryBlock.findUnique({
    where: { id }
  });
}

/**
 * Creates a new inventory block
 */
export async function createInventoryBlock(data: CreateInventoryBlockInput): Promise<InventoryBlock> {
  const db = getBookingDb();
  const block = await db.inventoryBlock.create({
    data: {
      ...data,
      availableQuantity: data.totalQuantity,
      expiryDate: new Date(data.expiryDate),
      status: (data.status as InventoryStatus) || InventoryStatus.Active,
      type: data.type as InventoryType
    }
  });

  // Create initial purchase transaction
  await db.inventoryTransaction.create({
    data: {
      inventoryBlockId: block.id,
      quantity: data.totalQuantity,
      type: 'Purchase',
      description: `Initial purchase for ${data.provider}`
    }
  });

  return block;
}

/**
 * Updates an inventory block
 */
export async function updateInventoryBlock(id: string, data: any, tx?: Prisma.TransactionClient): Promise<InventoryBlock> {
  const client = tx || getBookingDb();
  return client.inventoryBlock.update({
    where: { id },
    data
  });
}

/**
 * Creates an inventory transaction (e.g., depletion or addition)
 */
export async function createInventoryTransaction(data: {
  inventoryBlockId: string;
  quantity: number;
  type: InventoryTransactionType;
  bookingId?: string;
  description?: string;
}, tx?: Prisma.TransactionClient): Promise<InventoryTransaction> {
  const client = tx || getBookingDb();
  return client.inventoryTransaction.create({
    data: {
      ...data,
      type: data.type as InventoryTransactionType
    }
  });
}

/**
 * Manifest for an inventory block (list of bookings)
 */
export async function getInventoryBlockManifest(id: string): Promise<Booking[]> {
  const db = getBookingDb();
  return db.booking.findMany({
    where: { inventoryBlockId: id },
    orderBy: { bookingDate: 'desc' }
  } as any);
}

/**
 * Transaction history for an inventory block
 */
export async function getInventoryBlockTransactions(id: string): Promise<InventoryTransaction[]> {
  const db = getBookingDb();
  return db.inventoryTransaction.findMany({
    where: { inventoryBlockId: id },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Carry forward remaining inventory from one block to a new one
 */
export async function carryForwardInventory(id: string): Promise<InventoryBlock> {
  const db = getBookingDb();
  
  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const oldBlock = await tx.inventoryBlock.findUnique({ where: { id } });
    if (!oldBlock || oldBlock.availableQuantity <= 0) {
      throw new Error('No inventory to carry forward or block not found');
    }

    // Mark old block as carry forwarded
    await tx.inventoryBlock.update({
      where: { id },
      data: { status: 'CarryForwarded' }
    });

    // Create new block
    const newBlock = await tx.inventoryBlock.create({
      data: {
        type: oldBlock.type,
        provider: oldBlock.provider,
        reference: `${oldBlock.reference}-CF`,
        totalQuantity: oldBlock.availableQuantity,
        availableQuantity: oldBlock.availableQuantity,
        costPerUnit: oldBlock.costPerUnit,
        sellPricePerUnit: oldBlock.sellPricePerUnit,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days extension
        status: 'Active',
        parentBlockId: oldBlock.id
      }
    });

    // Log transactions
    await tx.inventoryTransaction.create({
      data: {
        inventoryBlockId: oldBlock.id,
        quantity: -oldBlock.availableQuantity,
        type: 'CarryForward',
        description: `Carried forward to block ${newBlock.id}`
      }
    });

    await tx.inventoryTransaction.create({
      data: {
        inventoryBlockId: newBlock.id,
        quantity: oldBlock.availableQuantity,
        type: 'Purchase',
        description: `Carried forward from block ${oldBlock.id}`
      }
    });

    return newBlock;
  });
}

/**
 * Gets aggregated inventory statistics
 */
export async function getInventoryStats(): Promise<{ totalCapacity: number; totalAvailable: number }> {
  const db = getBookingDb();
  const blocks = await db.inventoryBlock.findMany();
  
  return {
    totalCapacity: blocks.reduce((acc: number, b: InventoryBlock) => acc + (Number(b.totalQuantity) || 0), 0),
    totalAvailable: blocks.reduce((acc: number, b: InventoryBlock) => acc + (Number(b.availableQuantity) || 0), 0),
  };
}
