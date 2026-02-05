/**
 * Hotelston Mock Data Import Script
 * Imports sample static data into PostgreSQL database for testing and development
 * This creates mock data based on Hotelston API structure when the actual API is unavailable
 */

import { PrismaClient } from '@prisma/client';

// Database connection
const prisma = new PrismaClient();

// Mock data based on typical hotel booking system structure
const MOCK_DATA = {
  countries: [
    { code: 'US', name: 'United States', countryCode: 'US' },
    { code: 'AE', name: 'United Arab Emirates', countryCode: 'AE' },
    { code: 'GB', name: 'United Kingdom', countryCode: 'GB' },
    { code: 'FR', name: 'France', countryCode: 'FR' },
    { code: 'DE', name: 'Germany', countryCode: 'DE' },
    { code: 'IN', name: 'India', countryCode: 'IN' },
    { code: 'AU', name: 'Australia', countryCode: 'AU' },
    { code: 'CA', name: 'Canada', countryCode: 'CA' },
    { code: 'SG', name: 'Singapore', countryCode: 'SG' },
    { code: 'JP', name: 'Japan', countryCode: 'JP' }
  ],

  cities: [
    { name: 'New York', country: 'United States', countryCode: 'US', latitude: 40.7128, longitude: -74.0060, population: 8336817, timezone: 'America/New_York' },
    { name: 'Los Angeles', country: 'United States', countryCode: 'US', latitude: 34.0522, longitude: -118.2437, population: 3979576, timezone: 'America/Los_Angeles' },
    { name: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', latitude: 25.2048, longitude: 55.2708, population: 3331420, timezone: 'Asia/Dubai' },
    { name: 'London', country: 'United Kingdom', countryCode: 'GB', latitude: 51.5074, longitude: -0.1278, population: 8982000, timezone: 'Europe/London' },
    { name: 'Paris', country: 'France', countryCode: 'FR', latitude: 48.8566, longitude: 2.3522, population: 2161000, timezone: 'Europe/Paris' },
    { name: 'Mumbai', country: 'India', countryCode: 'IN', latitude: 19.0760, longitude: 72.8777, population: 12478000, timezone: 'Asia/Kolkata' },
    { name: 'Sydney', country: 'Australia', countryCode: 'AU', latitude: -33.8688, longitude: 151.2093, population: 5312000, timezone: 'Australia/Sydney' },
    { name: 'Toronto', country: 'Canada', countryCode: 'CA', latitude: 43.6532, longitude: -79.3832, population: 2930000, timezone: 'America/Toronto' },
    { name: 'Singapore', country: 'Singapore', countryCode: 'SG', latitude: 1.3521, longitude: 103.8198, population: 5686000, timezone: 'Asia/Singapore' },
    { name: 'Tokyo', country: 'Japan', countryCode: 'JP', latitude: 35.6762, longitude: 139.6503, population: 13960000, timezone: 'Asia/Tokyo' }
  ],

  hotelChains: [
    { name: 'Marriott International', code: 'MAR', website: 'https://www.marriott.com', logoUrl: 'https://example.com/marriott-logo.png', country: 'United States' },
    { name: 'Hilton Worldwide', code: 'HLT', website: 'https://www.hilton.com', logoUrl: 'https://example.com/hilton-logo.png', country: 'United States' },
    { name: 'Hyatt Hotels Corporation', code: 'H', website: 'https://www.hyatt.com', logoUrl: 'https://example.com/hyatt-logo.png', country: 'United States' },
    { name: 'InterContinental Hotels Group', code: 'IHG', website: 'https://www.ihg.com', logoUrl: 'https://example.com/ihg-logo.png', country: 'United Kingdom' },
    { name: 'Accor', code: 'ACCOR', website: 'https://www.accor.com', logoUrl: 'https://example.com/accor-logo.png', country: 'France' },
    { name: 'Wyndham Hotels & Resorts', code: 'WH', website: 'https://www.wyndhamhotels.com', logoUrl: 'https://example.com/wyndham-logo.png', country: 'United States' },
    { name: 'Best Western', code: 'BW', website: 'https://www.bestwestern.com', logoUrl: 'https://example.com/bestwestern-logo.png', country: 'United States' },
    { name: 'Four Seasons Hotels and Resorts', code: 'FS', website: 'https://www.fourseasons.com', logoUrl: 'https://example.com/fourseasons-logo.png', country: 'Canada' },
    { name: 'Ritz-Carlton', code: 'RC', website: 'https://www.ritzcarlton.com', logoUrl: 'https://example.com/ritzcarlton-logo.png', country: 'United States' },
    { name: 'Shangri-La Hotels and Resorts', code: 'SHANG', website: 'https://www.shangri-la.com', logoUrl: 'https://example.com/shangrila-logo.png', country: 'Hong Kong' }
  ],

  hotelFacilities: [
    { name: 'Wi-Fi', category: 'Connectivity' },
    { name: 'Swimming Pool', category: 'Recreation' },
    { name: 'Fitness Center', category: 'Wellness' },
    { name: 'Restaurant', category: 'Dining' },
    { name: 'Bar', category: 'Dining' },
    { name: 'Room Service', category: 'Services' },
    { name: 'Business Center', category: 'Business' },
    { name: 'Spa', category: 'Wellness' },
    { name: 'Parking', category: 'Transportation' },
    { name: 'Airport Shuttle', category: 'Transportation' },
    { name: 'Concierge', category: 'Services' },
    { name: 'Laundry Service', category: 'Services' },
    { name: '24 Hour Reception', category: 'Services' },
    { name: 'Air Conditioning', category: 'Comfort' },
    { name: 'Heating', category: 'Comfort' },
    { name: 'Non-Smoking Rooms', category: 'Room Features' },
    { name: 'Family Rooms', category: 'Room Features' },
    { name: 'Pet Friendly', category: 'Room Features' },
    { name: 'Meeting Rooms', category: 'Business' },
    { name: 'Banquet Hall', category: 'Events' }
  ],

  hotelTypes: [
    { name: 'Resort' },
    { name: 'Business Hotel' },
    { name: 'Boutique Hotel' },
    { name: 'Luxury Hotel' },
    { name: 'Budget Hotel' },
    { name: 'Airport Hotel' },
    { name: 'City Hotel' },
    { name: 'Beach Hotel' },
    { name: 'Mountain Hotel' },
    { name: 'Conference Hotel' }
  ],

  hotels: [
    {
      id: 'HOTEL001',
      name: 'Marriott Marquis New York',
      description: 'Luxury hotel in Times Square with modern amenities and excellent service',
      address: '1535 Broadway, New York, NY 10036',
      city: 'New York',
      country: 'United States',
      postalCode: '10036',
      latitude: 40.7580,
      longitude: -73.9855,
      starRating: 4.5,
      chainId: null,
      website: 'https://www.marriott.com/hotels/travel/nycmq-marriott-marquis-new-york/',
      phone: '+1 212-891-2000',
      email: 'info@marriottmarquis.com',
      amenities: ['Wi-Fi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Bar', 'Room Service', 'Business Center', 'Spa', 'Parking'],
      images: [
        { url: 'https://example.com/hotel1-1.jpg', alt: 'Hotel exterior' },
        { url: 'https://example.com/hotel1-2.jpg', alt: 'Lobby' },
        { url: 'https://example.com/hotel1-3.jpg', alt: 'Room' }
      ],
      policies: {
        checkInTime: '15:00',
        checkOutTime: '11:00',
        cancellationPolicy: 'Free cancellation until 24 hours before check-in',
        petPolicy: 'Pets not allowed',
        smokingPolicy: 'Non-smoking hotel'
      },
      externalId: 'MAR001',
      externalSource: 'Hotelston'
    },
    {
      id: 'HOTEL002',
      name: 'Burj Al Arab Jumeirah',
      description: 'Iconic luxury hotel in Dubai, known as the world\'s most luxurious hotel',
      address: 'Jumeirah St - Dubai - United Arab Emirates',
      city: 'Dubai',
      country: 'United Arab Emirates',
      postalCode: '114444',
      latitude: 25.1412,
      longitude: 55.1853,
      starRating: 5.0,
      chainId: null,
      website: 'https://www.jumeirah.com/en/stay/dubai/burj-al-arab/',
      phone: '+971 4 319 7777',
      email: 'info@burjalarab.com',
      amenities: ['Wi-Fi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Bar', 'Room Service', 'Spa', 'Airport Shuttle', 'Concierge'],
      images: [
        { url: 'https://example.com/hotel2-1.jpg', alt: 'Hotel exterior' },
        { url: 'https://example.com/hotel2-2.jpg', alt: 'Penthouse suite' },
        { url: 'https://example.com/hotel2-3.jpg', alt: 'Restaurant' }
      ],
      policies: {
        checkInTime: '15:00',
        checkOutTime: '12:00',
        cancellationPolicy: 'Free cancellation until 48 hours before check-in',
        petPolicy: 'Pets not allowed',
        smokingPolicy: 'Non-smoking hotel'
      },
      externalId: 'BA001',
      externalSource: 'Hotelston'
    },
    {
      id: 'HOTEL003',
      name: 'The Ritz-Carlton London',
      description: 'Luxury hotel in Piccadilly with elegant rooms and exceptional service',
      address: '165 Piccadilly, London W1J 9FA',
      city: 'London',
      country: 'United Kingdom',
      postalCode: 'W1J 9FA',
      latitude: 51.5099,
      longitude: -0.1436,
      starRating: 5.0,
      chainId: null,
      website: 'https://www.ritzcarlton.com/en/hotels/london',
      phone: '+44 20 7493 8181',
      email: 'info@ritzcarltonlondon.com',
      amenities: ['Wi-Fi', 'Fitness Center', 'Restaurant', 'Bar', 'Room Service', 'Business Center', 'Spa', 'Concierge', 'Laundry Service'],
      images: [
        { url: 'https://example.com/hotel3-1.jpg', alt: 'Hotel exterior' },
        { url: 'https://example.com/hotel3-2.jpg', alt: 'Lobby' },
        { url: 'https://example.com/hotel3-3.jpg', alt: 'Room' }
      ],
      policies: {
        checkInTime: '15:00',
        checkOutTime: '12:00',
        cancellationPolicy: 'Free cancellation until 24 hours before check-in',
        petPolicy: 'Pets not allowed',
        smokingPolicy: 'Non-smoking hotel'
      },
      externalId: 'RC001',
      externalSource: 'Hotelston'
    },
    {
      id: 'HOTEL004',
      name: 'Hilton Paris Opéra',
      description: 'Elegant hotel near Opéra Garnier with modern amenities',
      address: '3 Rue de la Caserne, 75009 Paris',
      city: 'Paris',
      country: 'France',
      postalCode: '75009',
      latitude: 48.8738,
      longitude: 2.3429,
      starRating: 4.0,
      chainId: null,
      website: 'https://www.hilton.com/en/hotels/parhioh-hilton-paris-opera/',
      phone: '+33 1 44 78 60 60',
      email: 'info@hiltonparisopera.com',
      amenities: ['Wi-Fi', 'Fitness Center', 'Restaurant', 'Bar', 'Room Service', 'Business Center', 'Parking'],
      images: [
        { url: 'https://example.com/hotel4-1.jpg', alt: 'Hotel exterior' },
        { url: 'https://example.com/hotel4-2.jpg', alt: 'Lobby' },
        { url: 'https://example.com/hotel4-3.jpg', alt: 'Room' }
      ],
      policies: {
        checkInTime: '15:00',
        checkOutTime: '12:00',
        cancellationPolicy: 'Free cancellation until 24 hours before check-in',
        petPolicy: 'Pets allowed with additional fee',
        smokingPolicy: 'Designated smoking areas available'
      },
      externalId: 'HLT001',
      externalSource: 'Hotelston'
    },
    {
      id: 'HOTEL005',
      name: 'Taj Mahal Palace Mumbai',
      description: 'Iconic luxury hotel overlooking the Arabian Sea',
      address: 'Apollo Bunder, Mumbai 400001',
      city: 'Mumbai',
      country: 'India',
      postalCode: '400001',
      latitude: 18.9220,
      longitude: 72.8347,
      starRating: 5.0,
      chainId: null,
      website: 'https://www.tajhotels.com/en-in/taj/taj-mahal-palace-mumbai/',
      phone: '+91 22 6665 3366',
      email: 'info@tajmahalpalace.com',
      amenities: ['Wi-Fi', 'Swimming Pool', 'Fitness Center', 'Restaurant', 'Bar', 'Room Service', 'Business Center', 'Spa', 'Airport Shuttle'],
      images: [
        { url: 'https://example.com/hotel5-1.jpg', alt: 'Hotel exterior' },
        { url: 'https://example.com/hotel5-2.jpg', alt: 'Lobby' },
        { url: 'https://example.com/hotel5-3.jpg', alt: 'Room' }
      ],
      policies: {
        checkInTime: '15:00',
        checkOutTime: '12:00',
        cancellationPolicy: 'Free cancellation until 24 hours before check-in',
        petPolicy: 'Pets not allowed',
        smokingPolicy: 'Non-smoking hotel'
      },
      externalId: 'TJ001',
      externalSource: 'Hotelston'
    }
  ]
};

/**
 * Import countries
 */
async function importCountries(): Promise<void> {
  console.log('Importing countries...');
  
  let importedCount = 0;
  for (const country of MOCK_DATA.countries) {
    try {
      await prisma.country.upsert({
        where: { code: country.code },
        update: {
          name: country.name,
          countryCode: country.countryCode,
          updatedAt: new Date()
        },
        create: {
          code: country.code,
          name: country.name,
          countryCode: country.countryCode
        }
      });
      importedCount++;
    } catch (error) {
      console.error(`Error importing country ${country.name}:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  console.log(`✅ Successfully imported ${importedCount} countries`);
}

/**
 * Import cities
 */
async function importCities(): Promise<void> {
  console.log('Importing cities...');
  
  let importedCount = 0;
  for (const city of MOCK_DATA.cities) {
    try {
      await prisma.city.upsert({
        where: { name: city.name },
        update: {
          country: city.country,
          countryCode: city.countryCode,
          latitude: city.latitude,
          longitude: city.longitude,
          population: city.population,
          timezone: city.timezone,
          updatedAt: new Date()
        },
        create: {
          name: city.name,
          country: city.country,
          countryCode: city.countryCode,
          latitude: city.latitude,
          longitude: city.longitude,
          population: city.population,
          timezone: city.timezone
        }
      });
      importedCount++;
    } catch (error) {
      console.error(`Error importing city ${city.name}:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  console.log(`✅ Successfully imported ${importedCount} cities`);
}

/**
 * Import hotel chains
 */
async function importHotelChains(): Promise<void> {
  console.log('Importing hotel chains...');
  
  let importedCount = 0;
  for (const chain of MOCK_DATA.hotelChains) {
    try {
      await prisma.hotelChain.upsert({
        where: { code: chain.code },
        update: {
          name: chain.name,
          website: chain.website,
          logoUrl: chain.logoUrl,
          country: chain.country,
          updatedAt: new Date()
        },
        create: {
          name: chain.name,
          code: chain.code,
          website: chain.website,
          logoUrl: chain.logoUrl,
          country: chain.country
        }
      });
      importedCount++;
    } catch (error) {
      console.error(`Error importing hotel chain ${chain.name}:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  console.log(`✅ Successfully imported ${importedCount} hotel chains`);
}

/**
 * Import hotel facilities
 */
async function importHotelFacilities(): Promise<void> {
  console.log('Importing hotel facilities...');
  
  let importedCount = 0;
  for (const facility of MOCK_DATA.hotelFacilities) {
    try {
      await prisma.hotelFacility.upsert({
        where: { name: facility.name },
        update: {
          category: facility.category,
          updatedAt: new Date()
        },
        create: {
          name: facility.name,
          category: facility.category
        }
      });
      importedCount++;
    } catch (error) {
      console.error(`Error importing hotel facility ${facility.name}:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  console.log(`✅ Successfully imported ${importedCount} hotel facilities`);
}

/**
 * Import hotel types
 */
async function importHotelTypes(): Promise<void> {
  console.log('Importing hotel types...');
  
  let importedCount = 0;
  for (const type of MOCK_DATA.hotelTypes) {
    try {
      await prisma.hotelType.upsert({
        where: { name: type.name },
        update: {
          updatedAt: new Date()
        },
        create: {
          name: type.name
        }
      });
      importedCount++;
    } catch (error) {
      console.error(`Error importing hotel type ${type.name}:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  console.log(`✅ Successfully imported ${importedCount} hotel types`);
}

/**
 * Import hotels
 */
async function importHotels(): Promise<void> {
  console.log('Importing hotels...');
  
  let importedCount = 0;
  for (const hotel of MOCK_DATA.hotels) {
    try {
      // First, try to find or create the hotel chain
      let chainId: string | null = null;
      if (hotel.chainId) {
        const chain = await prisma.hotelChain.findUnique({
          where: { id: hotel.chainId }
        });
        if (chain) {
          chainId = chain.id;
        }
      }
      
      // Create hotel
      await prisma.hotel.upsert({
        where: { externalId: hotel.id },
        update: {
          name: hotel.name,
          description: hotel.description,
          address: hotel.address,
          city: hotel.city,
          country: hotel.country,
          postalCode: hotel.postalCode,
          latitude: hotel.latitude,
          longitude: hotel.longitude,
          starRating: hotel.starRating,
          chainId: chainId,
          website: hotel.website,
          phone: hotel.phone,
          email: hotel.email,
          amenities: hotel.amenities,
          images: hotel.images,
          policies: hotel.policies,
          updatedAt: new Date()
        },
        create: {
          name: hotel.name,
          description: hotel.description,
          address: hotel.address,
          city: hotel.city,
          country: hotel.country,
          postalCode: hotel.postalCode,
          latitude: hotel.latitude,
          longitude: hotel.longitude,
          starRating: hotel.starRating,
          chainId: chainId,
          website: hotel.website,
          phone: hotel.phone,
          email: hotel.email,
          amenities: hotel.amenities,
          images: hotel.images,
          policies: hotel.policies,
          externalId: hotel.id,
          externalSource: 'Hotelston'
        }
      });
      importedCount++;
    } catch (error) {
      console.error(`Error importing hotel ${hotel.name}:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  console.log(`✅ Successfully imported ${importedCount} hotels`);
}

/**
 * Run all imports
 */
async function runImports(): Promise<void> {
  console.log('='.repeat(60));
  console.log('HOTELSTON MOCK DATA IMPORT');
  console.log('='.repeat(60));
  console.log('Importing sample data for testing and development...');
  console.log('');
  
  try {
    // Test connection first
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    console.log('');
    
    // Import data in order (dependencies first)
    await importCountries();
    await importCities();
    await importHotelChains();
    await importHotelFacilities();
    await importHotelTypes();
    await importHotels();
    
    console.log('');
    console.log('='.repeat(60));
    console.log('IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ All mock data imported successfully!');
    console.log('');
    console.log('Data imported:');
    console.log(`- ${MOCK_DATA.countries.length} countries`);
    console.log(`- ${MOCK_DATA.cities.length} cities`);
    console.log(`- ${MOCK_DATA.hotelChains.length} hotel chains`);
    console.log(`- ${MOCK_DATA.hotelFacilities.length} hotel facilities`);
    console.log(`- ${MOCK_DATA.hotelTypes.length} hotel types`);
    console.log(`- ${MOCK_DATA.hotels.length} hotels`);
    console.log('');
    console.log('Your database is now ready for testing!');
    console.log('You can start developing your booking engine features.');
    
  } catch (error) {
    console.error('❌ Import failed:', error instanceof Error ? error.message : String(error));
  } finally {
    await prisma.$disconnect();
  }
}

// Run imports if this script is executed directly
if (require.main === module) {
  runImports().then(() => {
    console.log('\n🎉 Mock data import completed successfully!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Mock data import failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

export { runImports, importCountries, importCities, importHotels, importHotelChains, importHotelFacilities, importHotelTypes };