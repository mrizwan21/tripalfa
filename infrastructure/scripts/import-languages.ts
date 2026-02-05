#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface Language {
  code: string;
  name: string;
}

async function importLanguages() {
  try {
    console.log('Fetching languages from LiteAPI...');
    
    // Fetch languages from LiteAPI
    const response = await axios.get('https://docs.liteapi.travel/reference/get_data-languages');
    
    // Parse the HTML response to extract JSON data
    const html = response.data;
    const jsonMatch = html.match(/<pre[^>]*>(\{[\s\S]*?\})<\/pre>/);
    
    if (!jsonMatch) {
      throw new Error('Could not find JSON data in response');
    }
    
    const jsonData = JSON.parse(jsonMatch[1]);
    const languages: Language[] = jsonData.data.languages || [];
    
    console.log(`Found ${languages.length} languages`);
    
    // Insert languages into database
    for (const language of languages) {
      try {
        await prisma.$executeRaw`
          INSERT INTO languages (code, name, created_at, updated_at)
          VALUES (${language.code}, ${language.name}, NOW(), NOW())
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            updated_at = NOW()
        `;
        console.log(`Inserted/updated language: ${language.code} - ${language.name}`);
      } catch (error) {
        console.error(`Error inserting language ${language.code}:`, error);
      }
    }
    
    console.log('Languages import completed successfully!');
    
  } catch (error) {
    console.error('Error importing languages:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  importLanguages();
}
