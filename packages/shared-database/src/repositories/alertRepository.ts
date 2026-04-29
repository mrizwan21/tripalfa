/**
 * Alert Repository
 * Management for Custom Alerts, Passport and Visa tracking.
 */

import { getCrmDb } from '../index';
import { CustomAlert, ClientPassport, ClientVisa, Prisma } from '../../generated/prisma-client';

// ─── Custom Alerts ──────────────────────────────────────────────────────────

export async function createCustomAlert(data: Prisma.CustomAlertCreateInput): Promise<CustomAlert> {
  return getCrmDb().customAlert.create({ data });
}

export async function findCustomAlerts(input: {
  travellerId?: string;
  severity?: string;
  isActive?: boolean;
  isDismissed?: boolean;
  triggerDateGte?: Date;
  triggerDateLte?: Date;
  isRecurring?: boolean;
}): Promise<CustomAlert[]> {
  return getCrmDb().customAlert.findMany({
    where: {
      ...(input.travellerId && { travellerId: input.travellerId }),
      ...(input.severity && { severity: input.severity }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.isDismissed !== undefined && { isDismissed: input.isDismissed }),
      ...(input.triggerDateGte && { triggerDate: { gte: input.triggerDateGte } }),
      ...(input.triggerDateLte && { triggerDate: { lte: input.triggerDateLte } }),
    },
    orderBy: [{ severity: 'desc' }, { triggerDate: 'asc' }],
  });
}

export async function updateAlert(id: string, data: Prisma.CustomAlertUpdateInput): Promise<CustomAlert> {
  return getCrmDb().customAlert.update({
    where: { id },
    data,
  });
}

export async function deleteAlerts(where: Prisma.CustomAlertWhereInput): Promise<Prisma.BatchPayload> {
  return getCrmDb().customAlert.deleteMany({ where });
}

export async function countAlerts(where: Prisma.CustomAlertWhereInput): Promise<number> {
  return getCrmDb().customAlert.count({ where });
}

// ─── Document Tracking ───────────────────────────────────────────────────────

export async function findPassportsForAlerts(where: Prisma.ClientPassportWhereInput): Promise<ClientPassport[]> {
  return getCrmDb().clientPassport.findMany({ where });
}

export async function findVisasForAlerts(where: Prisma.ClientVisaWhereInput): Promise<ClientVisa[]> {
  return getCrmDb().clientVisa.findMany({ where });
}

export async function findExpiringPassports(daysRange: number = 30): Promise<ClientPassport[]> {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysRange);
  
  return getCrmDb().clientPassport.findMany({
    where: {
      expiryDate: {
        lte: thresholdDate.toISOString(),
      },
      status: 'Active',
    },
    include: {
      traveller: true,
    },
  });
}

export async function findExpiringVisas(daysRange: number = 30): Promise<ClientVisa[]> {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysRange);

  return getCrmDb().clientVisa.findMany({
    where: {
      dateOfExpiry: {
        lte: thresholdDate.toISOString(),
      },
    },
    include: {
      traveller: true,
    },
  });
}
