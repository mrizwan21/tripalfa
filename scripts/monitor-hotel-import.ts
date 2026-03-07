#!/usr/bin/env node

/**
 * Real-time Hotel Import Monitor
 * 
 * This script monitors the hotel import progress in real-time by checking the database
 * and providing live updates on the import status.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

dotenv.config({ path: '../.env.local' });

const pool = new pg.Pool({
    connectionString: 'postgresql://postgres@localhost:5432/tripalfa_local',
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

class ImportMonitor {
    lastCount = 0;
    startTime = Date.now();

    async getCurrentStats() {
        const client = await pool.connect();
        try {
            const countResult = await client.query('SELECT COUNT(*) as total FROM public.hotels');
            const totalHotels = parseInt(countResult.rows[0].total);

            const recentResult = await client.query(`
                SELECT 
                    DATE(created_at) as import_date,
                    COUNT(*) as hotels_imported_today
                FROM public.hotels
                WHERE created_at >= CURRENT_DATE
                GROUP BY DATE(created_at)
                ORDER BY import_date DESC
                LIMIT 1
            `);

            const recentImport = recentResult.rows[0]?.hotels_imported_today || 0;

            return {
                totalHotels,
                recentImport,
                timeRunning: Date.now() - this.startTime
            };
        } finally {
            client.release();
        }
    }

    formatTime(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    async getImportRate(): Promise<number> {
        const stats = await this.getCurrentStats();
        const timeHours = stats.timeRunning / (1000 * 60 * 60);
        return timeHours > 0 ? Math.round((stats.totalHotels - 36799) / timeHours) : 0;
    }

    async getSystemStats(): Promise<{ cpu: string; memory: string; disk: string }> {
        try {
            // Get CPU usage
            const cpuResult = await execAsync('top -l 1 -n 0 | grep "CPU usage" | head -1');
            const cpu = cpuResult.stdout.trim();

            // Get memory usage
            const memResult = await execAsync('top -l 1 -n 0 | grep "PhysMem" | head -1');
            const memory = memResult.stdout.trim();

            // Get disk usage for current directory
            const diskResult = await execAsync('df -h . | tail -1');
            const disk = diskResult.stdout.trim();

            return { cpu, memory, disk };
        } catch (error) {
            return { cpu: 'N/A', memory: 'N/A', disk: 'N/A' };
        }
    }

    async displayStats() {
        const stats = await this.getCurrentStats();
        const importRate = await this.getImportRate();
        const systemStats = await this.getSystemStats();

        // Clear screen
        console.clear();
        
        console.log('🏨 LIVE HOTEL IMPORT MONITOR');
        console.log('='.repeat(50));
        console.log();
        
        console.log('📊 IMPORT STATISTICS:');
        console.log(`   📈 Total hotels in database: ${stats.totalHotels.toLocaleString()}`);
        console.log(`   ➕ Hotels imported today: ${stats.recentImport.toLocaleString()}`);
        console.log(`   ⏱️  Time running: ${this.formatTime(stats.timeRunning)}`);
        console.log(`   🚀 Import rate: ${importRate.toLocaleString()} hotels/hour`);
        console.log();
        
        console.log('💻 SYSTEM RESOURCES:');
        console.log(`   🔥 CPU: ${systemStats.cpu}`);
        console.log(`   💾 Memory: ${systemStats.memory}`);
        console.log(`   💿 Disk: ${systemStats.disk}`);
        console.log();
        
        console.log('🎯 PROGRESS INDICATORS:');
        const progress = ((stats.totalHotels - 36799) / 3000000) * 100;
        console.log(`   📊 Progress to 3M hotels: ${progress.toFixed(2)}%`);
        
        // Progress bar
        const barLength = 30;
        const filledLength = Math.round((progress / 100) * barLength);
        const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
        console.log(`   📊 [${bar}] ${progress.toFixed(1)}%`);
        console.log();
        
        console.log('💡 TIPS:');
        console.log('   • Import continues in background');
        console.log('   • Check terminal for country-by-country progress');
        console.log('   • Estimated completion: Several hours');
        console.log('   • Database: tripalfa_local (PostgreSQL)');
        console.log();
        
        console.log('🔄 Last updated: ' + new Date().toLocaleString());
        console.log('='.repeat(50));
        
        this.lastCount = stats.totalHotels;
    }

    async run() {
        console.log('🚀 Starting real-time import monitor...\n');
        
        try {
            // Initial stats
            await this.displayStats();
            
            // Update every 30 seconds
            setInterval(async () => {
                await this.displayStats();
            }, 30000);
            
        } catch (error) {
            console.error('❌ Monitor error:', error);
        }
    }
}

const monitor = new ImportMonitor();
monitor.run().catch(console.error);