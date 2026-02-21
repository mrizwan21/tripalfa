import { prisma as sharedPrisma } from '@tripalfa/shared-database';

export class DatabaseConnection {
    private static instance: DatabaseConnection;
    private prisma = sharedPrisma;

    private constructor() {
        // sharedPrisma is a singleton; no-op
    }

    static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    async connect(): Promise<typeof sharedPrisma> {
        try {
            await this.prisma.$connect();
            console.log('Successfully connected to the database');
            return this.prisma;
        } catch (error) {
            console.error('Failed to connect to the database:', error);
            throw error;
        }
    }

    getPrisma(): typeof sharedPrisma {
        return this.prisma;
    }
}
