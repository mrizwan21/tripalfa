import { Request } from 'express';
import crypto from 'crypto';

export interface ThreatEvent {
  id: string;
  type: ThreatType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sourceIp: string;
  userAgent: string;
  timestamp: Date;
  details: Record<string, any>;
  blocked: boolean;
}

export enum ThreatType {
  BRUTE_FORCE = 'BRUTE_FORCE',
  SQL_INJECTION = 'SQL_INJECTION',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  SUSPICIOUS_USER_AGENT = 'SUSPICIOUS_USER_AGENT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNUSUAL_ACCESS_PATTERN = 'UNUSUAL_ACCESS_PATTERN',
  MALICIOUS_PAYLOAD = 'MALICIOUS_PAYLOAD',
  BOT_DETECTION = 'BOT_DETECTION'
}

export interface ThreatPattern {
  pattern: RegExp;
  type: ThreatType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

export class ThreatDetectionService {
  private static instance: ThreatDetectionService;
  private threatEvents: ThreatEvent[] = [];
  private ipThreatCounts = new Map<string, number>();
  private userAgentThreatCounts = new Map<string, number>();
  private blockedIPs = new Set<string>();
  private suspiciousPatterns: ThreatPattern[] = [];

  private constructor() {
    this.initializePatterns();
  }

  public static getInstance(): ThreatDetectionService {
    if (!ThreatDetectionService.instance) {
      ThreatDetectionService.instance = new ThreatDetectionService();
    }
    return ThreatDetectionService.instance;
  }

  /**
   * Initialize known threat patterns
   */
  private initializePatterns(): void {
    this.suspiciousPatterns = [
      // SQL Injection patterns
      {
        pattern: /(\bunion\b.*\bselect\b|\bselect\b.*\bfrom\b|\bdrop\b.*\btable\b|\binsert\b.*\binto\b|\bupdate\b.*\bset\b)/i,
        type: ThreatType.SQL_INJECTION,
        severity: 'HIGH',
        description: 'SQL injection attempt detected'
      },
      
      // XSS patterns
      {
        pattern: /(<script|javascript:|onload=|onerror=|<iframe|<object|<embed)/i,
        type: ThreatType.XSS_ATTEMPT,
        severity: 'HIGH',
        description: 'Cross-site scripting attempt detected'
      },
      
      // Command injection patterns
      {
        pattern: /(;\s*(rm|cat|ls|pwd|whoami|id|uname|ps|netstat|wget|curl|nc|telnet)\s|`.*`|\$\(|\$\{.*\})/i,
        type: ThreatType.MALICIOUS_PAYLOAD,
        severity: 'CRITICAL',
        description: 'Command injection attempt detected'
      },
      
      // Suspicious user agents
      {
        pattern: /(sqlmap|nikto|nmap|masscan|zmap|nessus|openvas|burpsuite|owasp|zap)/i,
        type: ThreatType.SUSPICIOUS_USER_AGENT,
        severity: 'MEDIUM',
        description: 'Security scanner or penetration testing tool detected'
      },
      
      // Bot patterns
      {
        pattern: /(bot|crawler|spider|scraper|automated)/i,
        type: ThreatType.BOT_DETECTION,
        severity: 'LOW',
        description: 'Automated bot detected'
      }
    ];
  }

  /**
   * Analyze request for potential threats
   */
  public analyzeRequest(req: Request): ThreatEvent[] {
    const threats: ThreatEvent[] = [];
    const sourceIp = this.getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';

    // Check for blocked IP
    if (this.blockedIPs.has(sourceIp)) {
      threats.push(this.createThreatEvent(
        ThreatType.BOT_DETECTION,
        'CRITICAL',
        sourceIp,
        userAgent,
        { reason: 'IP is blocked' },
        true
      ));
      return threats;
    }

    // Analyze request body
    if (req.body) {
      const bodyString = JSON.stringify(req.body);
      const bodyThreats = this.analyzeString(bodyString, sourceIp, userAgent);
      threats.push(...bodyThreats);
    }

    // Analyze query parameters
    if (req.query) {
      const queryString = JSON.stringify(req.query);
      const queryThreats = this.analyzeString(queryString, sourceIp, userAgent);
      threats.push(...queryThreats);
    }

    // Analyze headers
    const headerThreats = this.analyzeHeaders(req.headers, sourceIp, userAgent);
    threats.push(...headerThreats);

    // Check for unusual access patterns
    const patternThreats = this.detectUnusualPatterns(sourceIp, userAgent);
    threats.push(...patternThreats);

    // Store threats
    threats.forEach(threat => {
      this.threatEvents.push(threat);
      
      // Update threat counts
      const currentCount = this.ipThreatCounts.get(sourceIp) || 0;
      this.ipThreatCounts.set(sourceIp, currentCount + 1);

      const currentUACount = this.userAgentThreatCounts.get(userAgent) || 0;
      this.userAgentThreatCounts.set(userAgent, currentUACount + 1);

      // Auto-block high-threat IPs
      if (threat.severity === 'CRITICAL' && currentCount >= 3) {
        this.blockIP(sourceIp, 3600000); // Block for 1 hour
      }
    });

    return threats;
  }

  /**
   * Analyze string content for threats
   */
  private analyzeString(content: string, sourceIp: string, userAgent: string): ThreatEvent[] {
    const threats: ThreatEvent[] = [];

    for (const pattern of this.suspiciousPatterns) {
      if (pattern.pattern.test(content)) {
        threats.push(this.createThreatEvent(
          pattern.type,
          pattern.severity,
          sourceIp,
          userAgent,
          { pattern: pattern.description, content: content.substring(0, 200) }
        ));
      }
    }

    return threats;
  }

  /**
   * Analyze headers for threats
   */
  private analyzeHeaders(headers: any, sourceIp: string, userAgent: string): ThreatEvent[] {
    const threats: ThreatEvent[] = [];

    // Check for suspicious headers
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-cluster-client-ip'];
    
    for (const header of suspiciousHeaders) {
      const value = headers[header];
      if (value && typeof value === 'string') {
        if (value.includes(';') || value.includes('<') || value.includes('>')) {
          threats.push(this.createThreatEvent(
            ThreatType.SUSPICIOUS_USER_AGENT,
            'MEDIUM',
            sourceIp,
            userAgent,
            { header, value }
          ));
        }
      }
    }

    return threats;
  }

  /**
   * Detect unusual access patterns
   */
  private detectUnusualPatterns(sourceIp: string, userAgent: string): ThreatEvent[] {
    const threats: ThreatEvent[] = [];
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    // Check for rapid requests from same IP
    const recentEvents = this.threatEvents.filter(event => 
      event.sourceIp === sourceIp && 
      event.timestamp.getTime() > oneHourAgo
    );

    if (recentEvents.length > 10) {
      threats.push(this.createThreatEvent(
        ThreatType.UNUSUAL_ACCESS_PATTERN,
        'HIGH',
        sourceIp,
        userAgent,
        { eventCount: recentEvents.length, timeWindow: '1 hour' }
      ));
    }

    // Check for multiple user agents from same IP
    const uniqueUserAgents = new Set(
      this.threatEvents
        .filter(event => event.sourceIp === sourceIp && event.timestamp.getTime() > oneHourAgo)
        .map(event => event.userAgent)
    );

    if (uniqueUserAgents.size > 5) {
      threats.push(this.createThreatEvent(
        ThreatType.UNUSUAL_ACCESS_PATTERN,
        'MEDIUM',
        sourceIp,
        userAgent,
        { uniqueUserAgents: uniqueUserAgents.size, timeWindow: '1 hour' }
      ));
    }

    return threats;
  }

  /**
   * Create threat event
   */
  private createThreatEvent(
    type: ThreatType,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    sourceIp: string,
    userAgent: string,
    details: Record<string, any> = {},
    blocked: boolean = false
  ): ThreatEvent {
    return {
      id: crypto.randomBytes(16).toString('hex'),
      type,
      severity,
      sourceIp,
      userAgent,
      timestamp: new Date(),
      details,
      blocked
    };
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: Request): string {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           (req.connection as any)?.socket?.remoteAddress ||
           'unknown';
  }

  /**
   * Block IP address
   */
  public blockIP(ip: string, duration: number = 3600000): void {
    this.blockedIPs.add(ip);
    
    setTimeout(() => {
      this.blockedIPs.delete(ip);
    }, duration);
  }

  /**
   * Unblock IP address
   */
  public unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
  }

  /**
   * Get threat statistics
   */
  public getThreatStatistics(timeWindow: number = 24 * 60 * 60 * 1000): {
    totalThreats: number;
    threatsByType: Record<ThreatType, number>;
    threatsBySeverity: Record<string, number>;
    topThreatIPs: Array<{ ip: string; count: number }>;
    blockedIPs: string[];
  } {
    const cutoffTime = Date.now() - timeWindow;
    const recentThreats = this.threatEvents.filter(event => 
      event.timestamp.getTime() > cutoffTime
    );

    const threatsByType = {} as Record<ThreatType, number>;
    const threatsBySeverity = {} as Record<string, number>;

    // Count threats by type
    for (const threat of recentThreats) {
      threatsByType[threat.type] = (threatsByType[threat.type] || 0) + 1;
      threatsBySeverity[threat.severity] = (threatsBySeverity[threat.severity] || 0) + 1;
    }

    // Get top threat IPs
    const ipCounts = new Map<string, number>();
    for (const threat of recentThreats) {
      ipCounts.set(threat.sourceIp, (ipCounts.get(threat.sourceIp) || 0) + 1);
    }

    const topThreatIPs = Array.from(ipCounts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalThreats: recentThreats.length,
      threatsByType,
      threatsBySeverity,
      topThreatIPs,
      blockedIPs: Array.from(this.blockedIPs)
    };
  }

  /**
   * Get recent threats
   */
  public getRecentThreats(limit: number = 100): ThreatEvent[] {
    return this.threatEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear old threat events
   */
  public cleanupOldEvents(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - maxAge;
    this.threatEvents = this.threatEvents.filter(event => 
      event.timestamp.getTime() > cutoffTime
    );
  }

  /**
   * Export threat data for analysis
   */
  public exportThreatData(): string {
    return JSON.stringify({
      threats: this.threatEvents,
      blockedIPs: Array.from(this.blockedIPs),
      statistics: this.getThreatStatistics()
    }, null, 2);
  }
}

export default ThreatDetectionService;