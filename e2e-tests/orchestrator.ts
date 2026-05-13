#!/usr/bin/env node
/**
 * Autonomous Test Orchestrator
 * Deploys and manages all test agents in YOLO mode
 * No manual intervention required
 */

import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';

const ROOT_DIR = process.cwd();
const E2E_DIR = join(ROOT_DIR, 'e2e-tests');

interface Agent {
  name: string;
  script: string;
  port: number;
  app: string;
}

const AGENTS: Agent[] = [
  { 
    name: 'agent-booking', 
    script: 'e2e-tests/agents/agent-booking.ts',
    port: 5173,
    app: 'booking-engine'
  },
  { 
    name: 'agent-b2b', 
    script: 'e2e-tests/agents/agent-b2b.ts',
    port: 5174,
    app: 'b2b-portal'
  },
  { 
    name: 'agent-callcenter', 
    script: 'e2e-tests/agents/agent-callcenter.ts',
    port: 5175,
    app: 'call-center-portal'
  },
  { 
    name: 'agent-admin', 
    script: 'e2e-tests/agents/agent-admin.ts',
    port: 5176,
    app: 'super-admin-portal'
  }
];

class AutonomousOrchestrator {
  private processes: Map<string, ChildProcess> = new Map();
  private results: Map<string, { passed: number; failed: number }> = new Map();

  async deploy() {
    console.log('🚀 Deploying Autonomous Test Agents - YOLO Mode');
    console.log('===============================================\n');

    // Deploy all agents in parallel
    const agentPromises = AGENTS.map(agent => this.deployAgent(agent));
    
    try {
      await Promise.all(agentPromises);
      console.log('\n✅ All agents deployed successfully');
      this.printSummary();
    } catch (error) {
      console.error('❌ Agent deployment failed:', error);
      process.exit(1);
    }
  }

  private deployAgent(agent: Agent): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`🤖 Deploying ${agent.name} for ${agent.app}...`);
      
      const args = [
        'playwright',
        'test',
        agent.script,
        '--config=e2e-tests/playwright.config.ts',
        '--headed',
        '--workers=4'
      ];

      const proc = spawn('npx', args, {
        stdio: 'pipe',
        env: {
          ...process.env,
          TEST_BASE_URL: `http://localhost:${agent.port}`,
          AUTONOMOUS_MODE: 'true',
          YOLO_MODE: 'true'
        }
      });

      proc.stdout?.on('data', (data) => {
        console.log(`[${agent.name}] ${data.toString()}`);
      });

      proc.stderr?.on('data', (data) => {
        console.error(`[${agent.name}] ${data.toString()}`);
      });

      proc.on('close', (code) => {
        this.results.set(agent.name, {
          passed: code === 0 ? 1 : 0,
          failed: code !== 0 ? 1 : 0
        });
        
        console.log(`[${agent.name}] Completed with code ${code}`);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`${agent.name} failed with code ${code}`));
        }
      });

      this.processes.set(agent.name, proc);
    });
  }

  private printSummary() {
    console.log('\n===============================================');
    console.log('📊 Autonomous Test Summary');
    console.log('===============================================');
    
    let totalPassed = 0;
    let totalFailed = 0;

    for (const [agent, result] of this.results.entries()) {
      console.log(`${agent}: ✅ ${result.passed} ❌ ${result.failed}`);
      totalPassed += result.passed;
      totalFailed += result.failed;
    }

    console.log('-----------------------------------------------');
    console.log(`Total: ✅ ${totalPassed} ❌ ${totalFailed}`);
    console.log(`Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
    console.log('===============================================');
  }
}

// Run orchestrator
const orchestrator = new AutonomousOrchestrator();
orchestrator.deploy();
