import { prisma } from '@tripalfa/shared-database';

async function main() {
  console.log('Seeding B2B corporate data (canonical schema)...');

  // Company
  const company = await prisma.company.create({
    data: {
      name: 'TravelPro International',
      code: `TP-${Date.now().toString().slice(-6)}`,
      status: 'active',
      isActive: true,
      email: 'info@travelpro.ae',
      phone: '+971-4-555-1234',
      address: 'Sheikh Zayed Road, Tower 3, Floor 25, Dubai',
      domain: 'travelpro.ae',
    },
  });

  // Branches
  await prisma.branch.createMany({
    data: [
      {
        companyId: company.id,
        name: 'NYC Headquarters',
        code: `HQ-NYC-${Date.now().toString().slice(-4)}`,
        address: '5th Ave, New York, USA',
        email: 'nyc@travelpro.ae',
        status: 'active',
        isActive: true,
      },
      {
        companyId: company.id,
        name: 'London Office',
        code: `BR-LON-${Date.now().toString().slice(-4)}`,
        address: 'Oxford St, London, UK',
        email: 'lon@travelpro.ae',
        status: 'active',
        isActive: true,
      },
    ],
  });

  // Departments / Designations / Cost Center
  await prisma.department.create({
    data: {
      companyId: company.id,
      name: 'Executive Management',
      isActive: true,
    },
  });

  await prisma.designation.create({
    data: {
      companyId: company.id,
      name: 'CEO',
      isActive: true,
    },
  });

  await prisma.costCenter.create({
    data: {
      companyId: company.id,
      name: 'Product Development',
      code: `CC-TECH-${Date.now().toString().slice(-4)}`,
      isActive: true,
    },
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
