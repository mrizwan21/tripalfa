import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding B2B corporate data...');

    // 1. Ensure a Tenant exists
    const tenant = await prisma.tenant.upsert({
        where: { domain: 'tripalfa.com' },
        update: {},
        create: {
            name: 'TripAlfa Global',
            domain: 'tripalfa.com',
            isActive: true,
            settings: { theme: 'purple' }
        }
    });

    // 2. Create a Company (Partner)
    const company = await prisma.company.create({
        data: {
            tenantId: tenant.id,
            name: 'TravelPro International',
            legalName: 'TravelPro International LLC',
            registrationNumber: 'LLC-2020-12345',
            taxId: 'TAX-1234567890',
            iataCode: 'TPX01',
            officeId: 'OFF-TPX-001',
            tier: 'enterprise',
            status: 'active',
            address: {
                street: 'Sheikh Zayed Road, Tower 3, Floor 25',
                city: 'Dubai',
                country: 'UAE',
                postalCode: '00000',
            },
            phone: '+971-4-555-1234',
            email: 'info@travelpro.ae',
            website: 'www.travelpro.ae'
        }
    });

    // 3. Create Branches
    const branch1 = await prisma.branch.create({
        data: {
            companyId: company.id,
            name: 'NYC Headquarters',
            code: 'HQ-NYC',
            address: { street: '5th Ave', city: 'New York', country: 'USA' },
            email: 'nyc@travelpro.ae'
        }
    });

    const branch2 = await prisma.branch.create({
        data: {
            companyId: company.id,
            name: 'London Office',
            code: 'BR-LON',
            address: { street: 'Oxford St', city: 'London', country: 'UK' },
            email: 'lon@travelpro.ae'
        }
    });

    // 4. Create Departments
    const dept1 = await prisma.department.create({
        data: {
            companyId: company.id,
            name: 'Executive Management',
            code: 'EXEC'
        }
    });

    const dept2 = await prisma.department.create({
        data: {
            companyId: company.id,
            name: 'Tech & Product',
            code: 'TECH',
            parentDepartmentId: dept1.id
        }
    });

    // 5. Create Designations
    await prisma.designation.createMany({
        data: [
            { companyId: company.id, name: 'CEO', level: 1 },
            { companyId: company.id, name: 'CTO', level: 2 },
            { companyId: company.id, name: 'Senior Developer', level: 4 }
        ]
    });

    // 6. Create Cost Centers
    await prisma.costCenter.create({
        data: {
            companyId: company.id,
            name: 'Product Development',
            code: 'CC-TECH-01',
            budget: 500000
        }
    });

    console.log('Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
