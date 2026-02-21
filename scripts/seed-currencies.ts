/**
 * Seed ISO 4217 currencies to the database
 * This adds all official ISO 4217 currency codes
 */

import { prisma } from '@tripalfa/shared-database';

// ISO 4217 currency data with decimal precision
// Based on Airwallex standards: https://www.airwallex.com/docs/payouts/how-airwallex-payouts-work/currency-precision
const ISO_CURRENCIES = [
  // 0 decimal places
  { code: 'BIF', name: 'Burundian Franc', decimalPrecision: 0 },
  { code: 'CLP', name: 'Chilean Peso', decimalPrecision: 0 },
  { code: 'DJF', name: 'Djiboutian Franc', decimalPrecision: 0 },
  { code: 'GNF', name: 'Guinean Franc', decimalPrecision: 0 },
  { code: 'ISK', name: 'Icelandic Króna', decimalPrecision: 0 },
  { code: 'JPY', name: 'Japanese Yen', decimalPrecision: 0, symbol: '¥' },
  { code: 'KMF', name: 'Comorian Franc', decimalPrecision: 0 },
  { code: 'KRW', name: 'South Korean Won', decimalPrecision: 0, symbol: '₩' },
  { code: 'MGA', name: 'Malagasy Ariary', decimalPrecision: 0 },
  { code: 'PYG', name: 'Paraguayan Guaraní', decimalPrecision: 0 },
  { code: 'RWF', name: 'Rwandan Franc', decimalPrecision: 0 },
  { code: 'UGX', name: 'Ugandan Shilling', decimalPrecision: 0 },
  { code: 'VND', name: 'Vietnamese Đồng', decimalPrecision: 0, symbol: '₫' },
  { code: 'VUV', name: 'Vanuatu Vatu', decimalPrecision: 0 },
  { code: 'XAF', name: 'Central African CFA Franc', decimalPrecision: 0 },
  { code: 'XOF', name: 'West African CFA Franc', decimalPrecision: 0 },
  { code: 'XPF', name: 'CFP Franc', decimalPrecision: 0 },

  // 3 decimal places
  { code: 'BHD', name: 'Bahraini Dinar', decimalPrecision: 3 },
  { code: 'IQD', name: 'Iraqi Dinar', decimalPrecision: 3 },
  { code: 'JOD', name: 'Jordanian Dinar', decimalPrecision: 3 },
  { code: 'KWD', name: 'Kuwaiti Dinar', decimalPrecision: 3 },
  { code: 'LYD', name: 'Libyan Dinar', decimalPrecision: 3 },
  { code: 'OMR', name: 'Omani Rial', decimalPrecision: 3 },
  { code: 'TND', name: 'Tunisian Dinar', decimalPrecision: 3 },

  // 2 decimal places (most common)
  { code: 'AED', name: 'UAE Dirham', decimalPrecision: 2, symbol: 'د.إ' },
  { code: 'AFN', name: 'Afghan Afghani', decimalPrecision: 2 },
  { code: 'ALL', name: 'Albanian Lek', decimalPrecision: 2 },
  { code: 'AMD', name: 'Armenian Dram', decimalPrecision: 2 },
  { code: 'ANG', name: 'Netherlands Antillean Guilder', decimalPrecision: 2 },
  { code: 'AOA', name: 'Angolan Kwanza', decimalPrecision: 2 },
  { code: 'ARS', name: 'Argentine Peso', decimalPrecision: 2, symbol: '$' },
  { code: 'AUD', name: 'Australian Dollar', decimalPrecision: 2, symbol: 'A$' },
  { code: 'AWG', name: 'Aruban Florin', decimalPrecision: 2 },
  { code: 'AZN', name: 'Azerbaijani Manat', decimalPrecision: 2 },
  { code: 'BAM', name: 'Bosnia-Herzegovina Convertible Mark', decimalPrecision: 2 },
  { code: 'BBD', name: 'Barbadian Dollar', decimalPrecision: 2 },
  { code: 'BDT', name: 'Bangladeshi Taka', decimalPrecision: 2 },
  { code: 'BGN', name: 'Bulgarian Lev', decimalPrecision: 2 },
  { code: 'BMD', name: 'Bermudian Dollar', decimalPrecision: 2 },
  { code: 'BND', name: 'Brunei Dollar', decimalPrecision: 2 },
  { code: 'BOB', name: 'Bolivian Boliviano', decimalPrecision: 2 },
  { code: 'BRL', name: 'Brazilian Real', decimalPrecision: 2, symbol: 'R$' },
  { code: 'BSD', name: 'Bahamian Dollar', decimalPrecision: 2 },
  { code: 'BTN', name: 'Bhutanese Ngultrum', decimalPrecision: 2 },
  { code: 'BWP', name: 'Botswanan Pula', decimalPrecision: 2 },
  { code: 'BYN', name: 'Belarusian Ruble', decimalPrecision: 2 },
  { code: 'BZD', name: 'Belize Dollar', decimalPrecision: 2 },
  { code: 'CAD', name: 'Canadian Dollar', decimalPrecision: 2, symbol: 'C$' },
  { code: 'CDF', name: 'Congolese Franc', decimalPrecision: 2 },
  { code: 'CHF', name: 'Swiss Franc', decimalPrecision: 2, symbol: 'Fr' },
  { code: 'CNY', name: 'Chinese Yuan', decimalPrecision: 2, symbol: '¥' },
  { code: 'COP', name: 'Colombian Peso', decimalPrecision: 2, symbol: '$' },
  { code: 'CRC', name: 'Costa Rican Colón', decimalPrecision: 2 },
  { code: 'CUC', name: 'Cuban Convertible Peso', decimalPrecision: 2 },
  { code: 'CUP', name: 'Cuban Peso', decimalPrecision: 2 },
  { code: 'CVE', name: 'Cape Verdean Escudo', decimalPrecision: 2 },
  { code: 'CZK', name: 'Czech Republic Koruna', decimalPrecision: 2 },
  { code: 'DKK', name: 'Danish Krone', decimalPrecision: 2 },
  { code: 'DOP', name: 'Dominican Peso', decimalPrecision: 2 },
  { code: 'DZD', name: 'Algerian Dinar', decimalPrecision: 2 },
  { code: 'EGP', name: 'Egyptian Pound', decimalPrecision: 2, symbol: '£' },
  { code: 'ERN', name: 'Eritrean Nakfa', decimalPrecision: 2 },
  { code: 'ETB', name: 'Ethiopian Birr', decimalPrecision: 2 },
  { code: 'EUR', name: 'Euro', decimalPrecision: 2, symbol: '€' },
  { code: 'FJD', name: 'Fijian Dollar', decimalPrecision: 2 },
  { code: 'FKP', name: 'Falkland Islands Pound', decimalPrecision: 2 },
  { code: 'GBP', name: 'British Pound Sterling', decimalPrecision: 2, symbol: '£' },
  { code: 'GEL', name: 'Georgian Lari', decimalPrecision: 2 },
  { code: 'GGP', name: 'Guernsey Pound', decimalPrecision: 2 },
  { code: 'GHS', name: 'Ghanaian Cedi', decimalPrecision: 2 },
  { code: 'GIP', name: 'Gibraltar Pound', decimalPrecision: 2 },
  { code: 'GMD', name: 'Gambian Dalasi', decimalPrecision: 2 },
  { code: 'GNF', name: 'Guinean Franc', decimalPrecision: 2 },
  { code: 'GTQ', name: 'Guatemalan Quetzal', decimalPrecision: 2 },
  { code: 'GYD', name: 'Guyanaese Dollar', decimalPrecision: 2 },
  { code: 'HKD', name: 'Hong Kong Dollar', decimalPrecision: 2, symbol: 'HK$' },
  { code: 'HNL', name: 'Honduran Lempira', decimalPrecision: 2 },
  { code: 'HRK', name: 'Croatian Kuna', decimalPrecision: 2 },
  { code: 'HTG', name: 'Haitian Gourde', decimalPrecision: 2 },
  { code: 'HUF', name: 'Hungarian Forint', decimalPrecision: 2 },
  { code: 'IDR', name: 'Indonesian Rupiah', decimalPrecision: 2, symbol: 'Rp' },
  { code: 'ILS', name: 'Israeli New Sheqel', decimalPrecision: 2, symbol: '₪' },
  { code: 'IMP', name: 'Manx pound', decimalPrecision: 2 },
  { code: 'INR', name: 'Indian Rupee', decimalPrecision: 2, symbol: '₹' },
  { code: 'IRR', name: 'Iranian Rial', decimalPrecision: 2 },
  { code: 'JEP', name: 'Jersey Pound', decimalPrecision: 2 },
  { code: 'JMD', name: 'Jamaican Dollar', decimalPrecision: 2 },
  { code: 'KES', name: 'Kenyan Shilling', decimalPrecision: 2 },
  { code: 'KGS', name: 'Kyrgystani Som', decimalPrecision: 2 },
  { code: 'KHR', name: 'Cambodian Riel', decimalPrecision: 2 },
  { code: 'KGS', name: 'Kyrgyzstani Som', decimalPrecision: 2 },
  { code: 'KPW', name: 'North Korean Won', decimalPrecision: 2 },
  { code: 'KYD', name: 'Cayman Islands Dollar', decimalPrecision: 2 },
  { code: 'KZT', name: 'Kazakhstani Tenge', decimalPrecision: 2 },
  { code: 'LAK', name: 'Laotian Kip', decimalPrecision: 2 },
  { code: 'LBP', name: 'Lebanese Pound', decimalPrecision: 2 },
  { code: 'LKR', name: 'Sri Lankan Rupee', decimalPrecision: 2 },
  { code: 'LRD', name: 'Liberian Dollar', decimalPrecision: 2 },
  { code: 'LSL', name: 'Lesotho Loti', decimalPrecision: 2 },
  { code: 'MAD', name: 'Moroccan Dirham', decimalPrecision: 2 },
  { code: 'MDL', name: 'Moldovan Leu', decimalPrecision: 2 },
  { code: 'MGA', name: 'Malagasy Ariary', decimalPrecision: 2 },
  { code: 'MKD', name: 'Macedonian Denar', decimalPrecision: 2 },
  { code: 'MMK', name: 'Myanma Kyat', decimalPrecision: 2 },
  { code: 'MNT', name: 'Mongolian Tugrik', decimalPrecision: 2 },
  { code: 'MOP', name: 'Macanese Pataca', decimalPrecision: 2 },
  { code: 'MRU', name: 'Mauritanian Ouguiya', decimalPrecision: 2 },
  { code: 'MUR', name: 'Mauritian Rupee', decimalPrecision: 2 },
  { code: 'MVR', name: 'Maldivian Rufiyaa', decimalPrecision: 2 },
  { code: 'MWK', name: 'Malawian Kwacha', decimalPrecision: 2 },
  { code: 'MXN', name: 'Mexican Peso', decimalPrecision: 2, symbol: '$' },
  { code: 'MYR', name: 'Malaysian Ringgit', decimalPrecision: 2 },
  { code: 'MZN', name: 'Mozambican Metical', decimalPrecision: 2 },
  { code: 'NAD', name: 'Namibian Dollar', decimalPrecision: 2 },
  { code: 'NGN', name: 'Nigerian Naira', decimalPrecision: 2 },
  { code: 'NIO', name: 'Nicaraguan Córdoba', decimalPrecision: 2 },
  { code: 'NOK', name: 'Norwegian Krone', decimalPrecision: 2 },
  { code: 'NPR', name: 'Nepalese Rupee', decimalPrecision: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', decimalPrecision: 2, symbol: 'NZ$' },
  { code: 'PAB', name: 'Panamanian Balboa', decimalPrecision: 2 },
  { code: 'PEN', name: 'Peruvian Nuevo Sol', decimalPrecision: 2 },
  { code: 'PGK', name: 'Papua New Guinean Kina', decimalPrecision: 2 },
  { code: 'PHP', name: 'Philippine Peso', decimalPrecision: 2, symbol: '₱' },
  { code: 'PKR', name: 'Pakistani Rupee', decimalPrecision: 2 },
  { code: 'PLN', name: 'Polish Zloty', decimalPrecision: 2 },
  { code: 'QAR', name: 'Qatari Rial', decimalPrecision: 2 },
  { code: 'RON', name: 'Romanian Leu', decimalPrecision: 2 },
  { code: 'RSD', name: 'Serbian Dinar', decimalPrecision: 2 },
  { code: 'RUB', name: 'Russian Ruble', decimalPrecision: 2, symbol: '₽' },
  { code: 'SAR', name: 'Saudi Riyal', decimalPrecision: 2 },
  { code: 'SBD', name: 'Solomon Islands Dollar', decimalPrecision: 2 },
  { code: 'SCR', name: 'Seychellois Rupee', decimalPrecision: 2 },
  { code: 'SDG', name: 'Sudanese Pound', decimalPrecision: 2 },
  { code: 'SEK', name: 'Swedish Krona', decimalPrecision: 2 },
  { code: 'SGD', name: 'Singapore Dollar', decimalPrecision: 2 },
  { code: 'SHP', name: 'Saint Helena Pound', decimalPrecision: 2 },
  { code: 'SLL', name: 'Sierra Leonean Leone', decimalPrecision: 2 },
  { code: 'SOS', name: 'Somali Shilling', decimalPrecision: 2 },
  { code: 'SRD', name: 'Surinamese Dollar', decimalPrecision: 2 },
  { code: 'SSP', name: 'South Sudanese Pound', decimalPrecision: 2 },
  { code: 'STN', name: 'São Tomé and Príncipe Dobra', decimalPrecision: 2 },
  { code: 'SYP', name: 'Syrian Pound', decimalPrecision: 2 },
  { code: 'SZL', name: 'Swazi Lilangeni', decimalPrecision: 2 },
  { code: 'THB', name: 'Thai Baht', decimalPrecision: 2, symbol: '฿' },
  { code: 'TJS', name: 'Tajikistani Somoni', decimalPrecision: 2 },
  { code: 'TMT', name: 'Turkmenistani Manat', decimalPrecision: 2 },
  { code: 'TND', name: 'Tunisian Dinar', decimalPrecision: 2 },
  { code: 'TOP', name: 'Tongan Paʻanga', decimalPrecision: 2 },
  { code: 'TRY', name: 'Turkish Lira', decimalPrecision: 2, symbol: '₺' },
  { code: 'TTD', name: 'Trinidad and Tobago Dollar', decimalPrecision: 2 },
  { code: 'TWD', name: 'New Taiwan Dollar', decimalPrecision: 2 },
  { code: 'TZS', name: 'Tanzanian Shilling', decimalPrecision: 2 },
  { code: 'UAH', name: 'Ukrainian Hryvnia', decimalPrecision: 2 },
  { code: 'UGX', name: 'Ugandan Shilling', decimalPrecision: 2 },
  { code: 'USD', name: 'US Dollar', decimalPrecision: 2, symbol: '$', isBaseCurrency: true },
  { code: 'UYU', name: 'Uruguayan Peso', decimalPrecision: 2 },
  { code: 'UZS', name: 'Uzbekistan Som', decimalPrecision: 2 },
  { code: 'VES', name: 'Venezuelan Bolívar', decimalPrecision: 2 },
  { code: 'WST', name: 'Samoan Tala', decimalPrecision: 2 },
  { code: 'XAG', name: 'Silver (troy ounce)', decimalPrecision: 2 },
  { code: 'XAU', name: 'Gold (troy ounce)', decimalPrecision: 2 },
  { code: 'XCD', name: 'East Caribbean Dollar', decimalPrecision: 2 },
  { code: 'XDR', name: 'Special Drawing Rights', decimalPrecision: 2 },
  { code: 'YER', name: 'Yemeni Rial', decimalPrecision: 2 },
  { code: 'ZAR', name: 'South African Rand', decimalPrecision: 2 },
  { code: 'ZMW', name: 'Zambian Kwacha', decimalPrecision: 2 },
  { code: 'ZWL', name: 'Zimbabwean Dollar', decimalPrecision: 2 },

  // Cryptocurrencies (common)
  { code: 'BTC', name: 'Bitcoin', decimalPrecision: 8, symbol: '₿' },
  { code: 'ETH', name: 'Ethereum', decimalPrecision: 18, symbol: 'Ξ' },
  { code: 'USDT', name: 'Tether', decimalPrecision: 6 },
  { code: 'USDC', name: 'USD Coin', decimalPrecision: 6 },
];

async function main() {
  console.log('🌱 Seeding ISO 4217 currencies...\n');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const currency of ISO_CURRENCIES) {
    try {
      const existing = await prisma.currency.findUnique({
        where: { code: currency.code },
      });

      if (existing) {
        // Update existing currency with any missing fields
        await prisma.currency.update({
          where: { code: currency.code },
          data: {
            name: currency.name,
            symbol: currency.symbol || existing.symbol,
            decimalPrecision: currency.decimalPrecision,
            isBaseCurrency: currency.isBaseCurrency || existing.isBaseCurrency,
          },
        });
        updated++;
      } else {
        // Create new currency
        await prisma.currency.create({
          data: {
            code: currency.code,
            name: currency.name,
            symbol: currency.symbol || currency.code,
            decimalPrecision: currency.decimalPrecision,
            isBaseCurrency: currency.isBaseCurrency || false,
            isActive: true,
          },
        });
        created++;
      }
    } catch (error) {
      console.error(`Error processing ${currency.code}:`, error);
      skipped++;
    }
  }

  // Summary
  const total = await prisma.currency.count();
  
  console.log('\n========================================');
  console.log('Currency Seed Complete');
  console.log('========================================');
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total in DB: ${total}`);
  console.log('========================================\n');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });