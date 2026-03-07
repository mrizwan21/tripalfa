#!/usr/bin/env node

/**
 * Standalone UAE Hotels Import Runner
 * 
 * This script runs the UAE hotels import without requiring npm install
 * or workspace dependencies. It uses tsx to run TypeScript files directly.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if required environment variables are set
const LITEAPI_API_KEY = process.env.LITEAPI_API_KEY;
const STATIC_DATABASE_URL = process.env.STATIC_DATABASE_URL;

if (!LITEAPI_API_KEY) {
    console.error('❌ Error: LITEAPI_API_KEY environment variable is required');
    console.log('Please set it with:');
    console.log('export LITEAPI_API_KEY=your_liteapi_key_here');
    process.exit(1);
}

if (!STATIC_DATABASE_URL) {
    console.error('❌ Error: STATIC_DATABASE_URL environment variable is required');
    console.log('Please set it with:');
    console.log('export STATIC_DATABASE_URL=postgresql://postgres@localhost:5432/staticdatabase');
    process.exit(1);
}

// Function to run a script with tsx
function runScript(scriptPath, args = []) {
    return new Promise((resolve, reject) => {
        console.log(`\n🚀 Running: ${scriptPath}`);
        console.log('='.repeat(60));
        
        const child = spawn('tsx', [scriptPath, ...args], {
            stdio: 'inherit',
            env: { ...process.env }
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${scriptPath} completed successfully`);
                resolve(code);
            } else {
                console.error(`❌ ${scriptPath} failed with code ${code}`);
                reject(new Error(`Script failed with code ${code}`));
            }
        });
        
        child.on('error', (error) => {
            console.error(`❌ Failed to start ${scriptPath}:`, error);
            reject(error);
        });
    });
}

// Main execution function
async function main() {
    console.log('🇦🇪 UAE Hotels Import System');
    console.log('='.repeat(60));
    console.log('Environment Variables:');
    console.log(`  LITEAPI_API_KEY: ${LITEAPI_API_KEY ? '✓ Set' : '✗ Not set'}`);
    console.log(`  STATIC_DATABASE_URL: ${STATIC_DATABASE_URL ? '✓ Set' : '✗ Not set'}`);
    console.log('');
    
    try {
        // Step 1: Test the system
        console.log('\n📋 Step 1: Testing the import system...');
        await runScript(join(__dirname, 'src/scripts/test-uae-import.ts'));
        
        // Step 2: Run the import
        console.log('\n📥 Step 2: Running UAE hotels import...');
        await runScript(join(__dirname, 'src/scripts/import-uae-hotels.ts'));
        
        // Step 3: Query the data
        console.log('\n🔍 Step 3: Querying imported data...');
        await runScript(join(__dirname, 'src/scripts/query-uae-hotels.ts'));
        
        console.log('\n🎉 All steps completed successfully!');
        console.log('\n📊 Summary:');
        console.log('  ✅ System tested and validated');
        console.log('  ✅ UAE hotels imported to PostgreSQL');
        console.log('  ✅ Data queries executed successfully');
        console.log('\n📍 Database: ' + STATIC_DATABASE_URL);
        console.log('📍 Hotel data is now available in the hotel.hotels table');
        
    } catch (error) {
        console.error('\n💥 Import process failed:');
        console.error(error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Ensure PostgreSQL is running on localhost:5432');
        console.log('2. Verify the database "staticdatabase" exists');
        console.log('3. Check that your LITEAPI_API_KEY is valid');
        console.log('4. Ensure you have network access to LITEAPI');
        process.exit(1);
    }
}

// Check if tsx is available
function checkTsx() {
    return new Promise((resolve, reject) => {
        const child = spawn('tsx', ['--version'], { stdio: 'ignore' });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve(true);
            } else {
                reject(new Error('tsx is not installed'));
            }
        });
        
        child.on('error', () => {
            reject(new Error('tsx is not installed'));
        });
    });
}

// Check if ts-node is available
function checkTsNode() {
    return new Promise((resolve, reject) => {
        const child = spawn('ts-node', ['--version'], { stdio: 'ignore' });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve(true);
            } else {
                reject(new Error('ts-node is not installed'));
            }
        });
        
        child.on('error', () => {
            reject(new Error('ts-node is not installed'));
        });
    });
}

// Check if node is available
function checkNode() {
    return new Promise((resolve, reject) => {
        const child = spawn('node', ['--version'], { stdio: 'ignore' });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve(true);
            } else {
                reject(new Error('node is not available'));
            }
        });
        
        child.on('error', () => {
            reject(new Error('node is not available'));
        });
    });
}

// Check prerequisites
async function checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    try {
        await checkNode();
        console.log('✅ Node.js is available');
    } catch (error) {
        console.error('❌ Node.js is not available');
        console.log('Please install Node.js from: https://nodejs.org/');
        process.exit(1);
    }
    
    try {
        await checkTsx();
        console.log('✅ tsx is available');
    } catch (error) {
        try {
            await checkTsNode();
            console.log('✅ ts-node is available (using as fallback)');
            // If ts-node is available but tsx is not, we'll modify the runScript function
            globalThis.useTsNode = true;
        } catch (error2) {
            console.error('❌ Neither tsx nor ts-node is available');
            console.log('Please install one of them:');
            console.log('  npm install -g tsx');
            console.log('  or');
            console.log('  npm install -g ts-node');
            process.exit(1);
        }
    }
}

// Override runScript if using ts-node
if (globalThis.useTsNode) {
    function runScript(scriptPath, args = []) {
        return new Promise((resolve, reject) => {
            console.log(`\n🚀 Running: ${scriptPath}`);
            console.log('='.repeat(60));
            
            const child = spawn('ts-node', ['--transpile-only', scriptPath, ...args], {
                stdio: 'inherit',
                env: { ...process.env }
            });
            
            child.on('close', (code) => {
                if (code === 0) {
                    console.log(`✅ ${scriptPath} completed successfully`);
                    resolve(code);
                } else {
                    console.error(`❌ ${scriptPath} failed with code ${code}`);
                    reject(new Error(`Script failed with code ${code}`));
                }
            });
            
            child.on('error', (error) => {
                console.error(`❌ Failed to start ${scriptPath}:`, error);
                reject(error);
            });
        });
    }
}

// Run the main function
checkPrerequisites().then(() => {
    main();
}).catch(error => {
    console.error('Failed to check prerequisites:', error.message);
    process.exit(1);
});