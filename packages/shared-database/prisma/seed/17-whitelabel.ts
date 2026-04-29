/**
 * 17-whitelabel.ts — WhiteLabelTheme, SystemConfig
 */
import { PrismaClient } from '../../generated/prisma-client';
import { TENANT_IDS } from './02-tenants.js';
import { log } from './helpers/faker.js';

export async function seedWhitelabel(prisma: PrismaClient) {
  console.log('\n🎨 [17-whitelabel] Seeding whitelabel themes...');

  const themes = [
    { tenantId: TENANT_IDS.master, primary: '#1d4ed8', secondary: '#ffffff', css: '/* Master Theme */', logo: '/logos/master.png' },
    { tenantId: TENANT_IDS.sub1, primary: '#059669', secondary: '#f3f4f6', css: '/* Gulf Travel Theme */', logo: '/logos/gulf.png' },
    { tenantId: TENANT_IDS.sub2, primary: '#ea580c', secondary: '#fffbeb', css: '/* Riyadh Express Theme */', logo: '/logos/riyadh.png' },
    { tenantId: TENANT_IDS.sub5, primary: '#4f46e5', secondary: '#eef2ff', css: '/* Jeddah B2C Theme */', logo: '/logos/jeddah.png' },
    { tenantId: TENANT_IDS.corp1, primary: '#b91c1c', secondary: '#fef2f2', css: '/* BPC Corp Theme */', logo: '/logos/bpc.png' },
  ];

  let themeCount = 0;
  for (const t of themes) {
    await prisma.whiteLabelTheme.upsert({
      where: { tenantId: t.tenantId },
      update: {},
      create: {
        tenantId: t.tenantId,
        primaryColor: t.primary,
        secondaryColor: t.secondary,
        customCss: t.css,
        logoUrl: t.logo,
        fontFamily: 'Inter',
        featureFlags: { enableChat: true, enableDarkMode: true },
      },
    });
    themeCount++;
  }

  log('17-whitelabel', 'WhiteLabelTheme', themeCount);
}
