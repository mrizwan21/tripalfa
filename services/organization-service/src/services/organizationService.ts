import { prisma as sharedPrisma } from '@tripalfa/shared-database';

export class OrganizationService {
    private prisma: typeof sharedPrisma;

    constructor(prisma: typeof sharedPrisma = sharedPrisma) {
        this.prisma = prisma;
    }

    // Departments
    async getDepartments(params: any, userId: string, role: string) {
        const { companyId, skip = 0, take = 10 } = params;
        const [data, total] = await Promise.all([
            this.prisma.department.findMany({
                where: { companyId },
                skip: Number(skip),
                take: Number(take),
                orderBy: { name: 'asc' }
            }),
            this.prisma.department.count({ where: { companyId } })
        ]);
        return { data, total };
    }

    async getDepartmentById(id: string, userId: string, role: string) {
        return await this.prisma.department.findUnique({
            where: { id }
        });
    }

    async createDepartment(data: any, userId: string, role: string) {
        return await this.prisma.department.create({
            data: {
                name: data.name,
                company: { connect: { id: data.companyId } },
                isActive: data.isActive !== undefined ? data.isActive : true
            }
        });
    }

    async updateDepartment(id: string, data: any, userId: string, role: string) {
        return await this.prisma.department.update({
            where: { id },
            data: {
                name: data.name,
                isActive: data.isActive
            }
        });
    }

    async deleteDepartment(id: string, userId: string, role: string) {
        return await this.prisma.department.delete({
            where: { id }
        });
    }

    // Designations
    async getDesignations(params: any, userId: string, role: string) {
        const { companyId, skip = 0, take = 10 } = params;
        const [data, total] = await Promise.all([
            this.prisma.designation.findMany({
                where: { companyId },
                skip: Number(skip),
                take: Number(take),
                orderBy: { name: 'asc' }
            }),
            this.prisma.designation.count({ where: { companyId } })
        ]);
        return { data, total };
    }

    async createDesignation(data: any, userId: string, role: string) {
        return await this.prisma.designation.create({
            data: {
                name: data.name,
                company: { connect: { id: data.companyId } },
                isActive: data.isActive !== undefined ? data.isActive : true
            }
        });
    }

    // Cost Centers
    async getCostCenters(params: any, userId: string, role: string) {
        const { companyId, skip = 0, take = 10 } = params;
        const [data, total] = await Promise.all([
            this.prisma.costCenter.findMany({
                where: { companyId },
                skip: Number(skip),
                take: Number(take),
                orderBy: { name: 'asc' }
            }),
            this.prisma.costCenter.count({ where: { companyId } })
        ]);
        return { data, total };
    }

    async createCostCenter(data: any, userId: string, role: string) {
        return await this.prisma.costCenter.create({
            data: {
                name: data.name,
                code: data.code,
                company: { connect: { id: data.companyId } },
                isActive: data.isActive !== undefined ? data.isActive : true
            }
        });
    }

    async updateCostCenter(id: string, data: any, userId: string, role: string) {
        return await this.prisma.costCenter.update({
            where: { id },
            data: {
                name: data.name,
                code: data.code,
                isActive: data.isActive
            }
        });
    }

    async deleteCostCenter(id: string, userId: string, role: string) {
        return await this.prisma.costCenter.delete({
            where: { id }
        });
    }

    // Campaigns
    async getCampaigns(params: any, userId: string, role: string) {
        const { companyId, skip = 0, take = 10 } = params;
        const [data, total] = await Promise.all([
            this.prisma.campaign.findMany({
                where: { companyId },
                skip: Number(skip),
                take: Number(take),
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.campaign.count({ where: { companyId } })
        ]);

        // Map to format expected by client
        const mappedData = data.map(camp => ({
            ...camp,
            targetAudience: camp.targetAudience,
            metrics: {
                impressions: camp.impressions,
                clicks: camp.clicks,
                conversions: camp.conversions
            }
        }));

        return { data: mappedData, total };
    }

    async createCampaign(data: any, userId: string, role: string) {
        const camp = await this.prisma.campaign.create({
            data: {
                name: data.name,
                description: data.description,
                company: { connect: { id: data.companyId } },
                status: data.status || 'active',
                targetAudience: data.targetAudience || [],
                startDate: data.startDate ? new Date(data.startDate) : new Date(),
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                budget: data.budget
            }
        });

        return {
            ...camp,
            metrics: {
                impressions: camp.impressions,
                clicks: camp.clicks,
                conversions: camp.conversions
            }
        };
    }

    async updateCampaign(id: string, data: any, userId: string, role: string) {
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.targetAudience !== undefined) updateData.targetAudience = data.targetAudience;
        if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
        if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
        if (data.budget !== undefined) updateData.budget = data.budget;

        const camp = await this.prisma.campaign.update({
            where: { id },
            data: updateData
        });

        return {
            ...camp,
            metrics: {
                impressions: camp.impressions,
                clicks: camp.clicks,
                conversions: camp.conversions
            }
        };
    }
}
