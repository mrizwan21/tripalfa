/**
 * Test Server Bootstrap Utility
 * 
 * Provides Test HTTP server for integration tests.
 * Manages server lifecycle (start/stop) and exposes test API URL.
 * 
 * Usage:
 *   // In global-setup.ts
 *   await testServer.start();
 *   
 *   // In test files
 *   const API_BASE_URL = testServer.getUrl();
 *   
 *   // In global-teardown.ts
 *   await testServer.stop();
 */

import type { Server } from 'http';
import app from '../../src/app';
import type { Express } from 'express';

class TestServer {
  private server: Server | null = null;
  private port: number = 0;
  private isRunning: boolean = false;

  /**
   * Start test server on a unique port
   * @param port Optional port number (default: ephemeral port 0 for auto-assignment)
   */
  async start(port: number = 0): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️  Test server is already running on port', this.port);
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.server = (app as Express).listen(port, () => {
          const address = this.server?.address();
          if (address && typeof address !== 'string') {
            this.port = address.port;
            this.isRunning = true;
            console.log(`✅ Test server started on port ${this.port}`);
            resolve();
          } else {
            reject(new Error('Failed to determine server address'));
          }
        });

        // Handle server errors
        this.server.on('error', (error) => {
          console.error('❌ Test server error:', error);
          this.isRunning = false;
          reject(error);
        });

        // Set connection timeout
        this.server.setTimeout(60000); // 60 seconds
      } catch (error) {
        console.error('❌ Failed to start test server:', error);
        reject(error);
      }
    });
  }

  /**
   * Stop test server and cleanup connections
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.server) {
      console.warn('⚠️  Test server is not running');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        // Destroy all keep-alive connections
        const connections: Set<any> = new Set();
        this.server?.on('connection', (conn) => {
          connections.add(conn);
          conn.on('close', () => {
            connections.delete(conn);
          });
        });

        // Close the server
        this.server?.close((error) => {
          if (error) {
            console.error('❌ Error closing test server:', error);
            // Force close remaining connections
            connections.forEach((conn) => conn.destroy());
            reject(error);
          } else {
            this.isRunning = false;
            this.server = null;
            this.port = 0;
            console.log('✅ Test server stopped');
            resolve();
          }
        });

        // Force close after timeout
        setTimeout(() => {
          if (this.isRunning && this.server) {
            console.warn('⚠️  Force closing test server (timeout)');
            connections.forEach((conn) => conn.destroy());
            this.server?.close();
            this.isRunning = false;
            this.server = null;
            this.port = 0;
            resolve();
          }
        }, 5000);
      } catch (error) {
        console.error('❌ Failed to stop test server:', error);
        this.isRunning = false;
        this.server = null;
        this.port = 0;
        reject(error);
      }
    });
  }

  /**
   * Get test server base URL (e.g., http://localhost:3001)
   * @throws Error if server is not running
   */
  getUrl(): string {
    if (!this.isRunning || this.port === 0) {
      throw new Error(
        'Test server is not running. Call testServer.start() in global setup before accessing the URL.'
      );
    }
    return `http://localhost:${this.port}`;
  }

  /**
   * Get test server API base URL (e.g., http://localhost:3001/api)
   * @throws Error if server is not running
   */
  getApiUrl(): string {
    return `${this.getUrl()}/api`;
  }

  /**
   * Check if server is running
   */
  isReady(): boolean {
    return this.isRunning && this.port > 0;
  }

  /**
   * Get port number
   */
  getPort(): number {
    if (!this.isRunning) {
      throw new Error('Test server is not running');
    }
    return this.port;
  }
}

// Export singleton instance
export const testServer = new TestServer();

// Export for direct usage
export default testServer;
