import { Enquiry, Prisma } from '../../generated/prisma-client';
import { getCrmDb } from '../index';

export async function findEnquiryById(enquiryId: string): Promise<Enquiry | null> {
  return getCrmDb().enquiry.findUnique({
    where: { enquiryId },
  });
}

export async function createEnquiry(data: Prisma.EnquiryCreateInput): Promise<Enquiry> {
  return getCrmDb().enquiry.create({ data });
}

export async function updateEnquiry(enquiryId: string, data: Prisma.EnquiryUpdateInput): Promise<Enquiry> {
  return getCrmDb().enquiry.update({
    where: { enquiryId },
    data,
  });
}

export async function findEnquiries(params: {
  where?: Prisma.EnquiryWhereInput;
  orderBy?: Prisma.EnquiryOrderByWithRelationInput;
  skip?: number;
  take?: number;
}): Promise<Enquiry[]> {
  return getCrmDb().enquiry.findMany({
    where: params.where,
    orderBy: params.orderBy ?? { createdAt: 'desc' },
    skip: params.skip,
    take: params.take,
  });
}
