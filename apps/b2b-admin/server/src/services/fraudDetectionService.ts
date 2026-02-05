import { Request } from 'express';
import crypto from 'crypto';

export interface FraudScore {
  userId?: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  score: number; // 0-100, higher = more suspicious
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: FraudFactor[];
  timestamp: Date;
}

export interface FraudFactor {
  type: FraudFactorType;
  weight: number;
  description: string;
  value?: any;
}

export enum FraudFactorType {
  UNUSUAL_LOCATION = 'UNUSUAL_LOCATION',
  RAPID_ACTIONS = 'RAPID_ACTIONS',
  UNUSUAL_DEVICE = 'UNUSUAL_DEVICE',
  SUSPICIOUS_BEHAVIOR = 'SUSPICIOUS_BEHAVIOR',
  ACCOUNT_ANOMALY = 'ACCOUNT_ANOMALY',
  IP_REPUTATION = 'IP_REPUTATION',
  TIME_ANOMALY = 'TIME_ANOMALY',
  GEO_VELOCITY = 'GEO_VELOCITY'
}

export interface UserBehaviorProfile {
  userId: string;
  typicalLocations: string[];
  typicalDevices: string[];
  typicalTimes: number[]; // Hours of day (0-23)
  averageSessionDuration: number;
  typicalActions: string[];
  lastLoginLocation?: string;
  lastLoginTime?: Date;
  riskThreshold: number;
}

export class FraudDetectionService {
  private static instance: FraudDetectionService;
  private userProfiles = new Map<string, UserBehaviorProfile>();
  private sessionActivity = new Map<string, ActivityLog[]>();
  private ipReputation = new Map<string, number>(); // IP -> reputation score (0-100)
  private geoLocationCache = new Map<string, GeoLocation>();

  private constructor() {
    this.initializeReputationData();
  }

  public static getInstance(): FraudDetectionService {
    if (!FraudDetectionService.instance) {
      FraudDetectionService.instance = new FraudDetectionService();
    }
    return FraudDetectionService.instance;
  }

  /**
   * Analyze request for fraud indicators
   */
  public async analyzeFraudRisk(req: Request, userId?: string): Promise<FraudScore> {
    const sessionId = this.getSessionId(req);
    const ipAddress = this.getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    const timestamp = new Date();

    const factors: FraudFactor[] = [];

    // Get or create user profile
    let userProfile: UserBehaviorProfile | null = null;
    if (userId) {
      userProfile = this.getUserProfile(userId);
      if (!userProfile) {
        userProfile = this.createUserProfile(userId);
      }
    }

    // 1. Location analysis
    const locationFactor = await this.analyzeLocation(ipAddress, userProfile);
    if (locationFactor) factors.push(locationFactor);

    // 2. Device analysis
    const deviceFactor = await this.analyzeDevice(userAgent, userProfile);
    if (deviceFactor) factors.push(deviceFactor);

    // 3. Time analysis
    const timeFactor = await this.analyzeTime(timestamp, userProfile);
    if (timeFactor) factors.push(timeFactor);

    // 4. Behavior analysis
    const behaviorFactor = await this.analyzeBehavior(sessionId, req.path, timestamp);
    if (behaviorFactor) factors.push(behaviorFactor);

    // 5. Account anomaly analysis
    if (userProfile) {
      const accountFactor = await this.analyzeAccountAnomaly(userProfile, ipAddress, userAgent);
      if (accountFactor) factors.push(accountFactor);
    }

    // 6. IP reputation analysis
    const ipFactor = await this.analyzeIPReputation(ipAddress);
    if (ipFactor) factors.push(ipFactor);

    // Calculate total score
    const totalScore = this.calculateFraudScore(factors);
    const riskLevel = this.determineRiskLevel(totalScore);

    // Update user profile
    if (userProfile) {
      this.updateUserProfile(userProfile, ipAddress, userAgent, timestamp);
    }

    // Log activity
    this.logActivity(sessionId, req.path, ipAddress, userAgent, totalScore, timestamp);

    return {
      userId,
      sessionId,
      ipAddress,
      userAgent,
      score: totalScore,
      riskLevel,
      factors,
      timestamp
    };
  }

  /**
   * Analyze location for fraud indicators
   */
  private async analyzeLocation(ipAddress: string, userProfile?: UserBehaviorProfile): Promise<FraudFactor | null> {
    try {
      const location = await this.getGeoLocation(ipAddress);
      if (!location) return null;

      if (!userProfile) {
        // New user, low risk for location
        return null;
      }

      // Check if location is unusual
      const isUnusualLocation = !userProfile.typicalLocations.includes(location.country);
      
      if (isUnusualLocation) {
        // Check geo-velocity (impossible travel)
        if (userProfile.lastLoginLocation) {
          const lastLocation = await this.getGeoLocation(userProfile.lastLoginLocation);
          if (lastLocation) {
            const distance = this.calculateDistance(location, lastLocation);
            const timeDiff = Date.now() - (userProfile.lastLoginTime?.getTime() || 0);
            const maxSpeed = 1000; // km/h (commercial flight speed)
            const requiredSpeed = distance / (timeDiff / (1000 * 60 * 60)); // km/h

            if (requiredSpeed > maxSpeed) {
              return {
                type: FraudFactorType.GEO_VELOCITY,
                weight: 80,
                description: `Impossible travel detected: ${distance.toFixed(0)}km in ${timeDiff / (1000 * 60)} minutes`,
                value: { distance, timeDiff, requiredSpeed }
              };
            }
          }
        }

        return {
          type: FraudFactorType.UNUSUAL_LOCATION,
          weight: 40,
          description: `Login from unusual location: ${location.country}`,
          value: location
        };
      }

      return null;
    } catch (error) {
      console.error('Location analysis failed:', error);
      return null;
    }
  }

  /**
   * Analyze device for fraud indicators
   */
  private analyzeDevice(userAgent: string, userProfile?: UserBehaviorProfile): Promise<FraudFactor | null> {
    if (!userProfile) return Promise.resolve(null);

    const isUnusualDevice = !userProfile.typicalDevices.includes(userAgent);
    
    if (isUnusualDevice) {
      return Promise.resolve({
        type: FraudFactorType.UNUSUAL_DEVICE,
        weight: 30,
        description: 'Login from unusual device/browser',
        value: userAgent
      });
    }

    return Promise.resolve(null);
  }

  /**
   * Analyze time for fraud indicators
   */
  private analyzeTime(timestamp: Date, userProfile?: UserBehaviorProfile): Promise<FraudFactor | null> {
    if (!userProfile) return Promise.resolve(null);

    const hour = timestamp.getHours();
    const isUnusualTime = !userProfile.typicalTimes.includes(hour);
    
    if (isUnusualTime) {
      return Promise.resolve({
        type: FraudFactorType.TIME_ANOMALY,
        weight: 20,
        description: `Login at unusual time: ${hour}:00`,
        value: hour
      });
    }

    return Promise.resolve(null);
  }

  /**
   * Analyze behavior patterns
   */
  private analyzeBehavior(sessionId: string, path: string, timestamp: Date): Promise<FraudFactor | null> {
    const activities = this.sessionActivity.get(sessionId) || [];
    
    // Check for rapid actions
    const recentActivities = activities.filter(a => 
      timestamp.getTime() - a.timestamp.getTime() < 5000 // Last 5 seconds
    );

    if (recentActivities.length > 5) {
      return Promise.resolve({
        type: FraudFactorType.RAPID_ACTIONS,
        weight: 50,
        description: `Rapid actions detected: ${recentActivities.length} requests in 5 seconds`,
        value: recentActivities.length
      });
    }

    // Check for suspicious paths
    const suspiciousPaths = ['/admin', '/api/users', '/api/companies', '/api/audit'];
    if (suspiciousPaths.some(suspiciousPath => path.includes(suspiciousPath))) {
      return Promise.resolve({
        type: FraudFactorType.SUSPICIOUS_BEHAVIOR,
        weight: 30,
        description: `Accessed suspicious path: ${path}`,
        value: path
      });
    }

    return Promise.resolve(null);
  }

  /**
   * Analyze account anomalies
   */
  private analyzeAccountAnomaly(userProfile: UserBehaviorProfile, ipAddress: string, userAgent: string): Promise<FraudFactor | null> {
    // Check for multiple IPs in short time
    const recentActivity = this.getRecentActivity(userProfile.userId, 3600000); // 1 hour
    
    const uniqueIPs = new Set(recentActivity.map(a => a.ipAddress));
    const uniqueUserAgents = new Set(recentActivity.map(a => a.userAgent));

    if (uniqueIPs.size > 3) {
      return Promise.resolve({
        type: FraudFactorType.ACCOUNT_ANOMALY,
        weight: 60,
        description: `Multiple IPs detected: ${uniqueIPs.size} IPs in 1 hour`,
        value: { uniqueIPs: Array.from(uniqueIPs) }
      });
    }

    if (uniqueUserAgents.size > 3) {
      return Promise.resolve({
        type: FraudFactorType.ACCOUNT_ANOMALY,
        weight: 40,
        description: `Multiple devices detected: ${uniqueUserAgents.size} devices in 1 hour`,
        value: { uniqueUserAgents: Array.from(uniqueUserAgents) }
      });
    }

    return Promise.resolve(null);
  }

  /**
   * Analyze IP reputation
   */
  private analyzeIPReputation(ipAddress: string): Promise<FraudFactor | null> {
    const reputation = this.ipReputation.get(ipAddress) || 0;
    
    if (reputation > 70) {
      return Promise.resolve({
        type: FraudFactorType.IP_REPUTATION,
        weight: reputation,
        description: `Poor IP reputation score: ${reputation}/100`,
        value: reputation
      });
    }

    return Promise.resolve(null);
  }

  /**
   * Calculate total fraud score
   */
  private calculateFraudScore(factors: FraudFactor[]): number {
    let totalScore = 0;
    
    // Apply weights with diminishing returns
    factors.forEach(factor => {
      totalScore += factor.weight * (1 - totalScore / 100);
    });

    return Math.min(100, Math.max(0, totalScore));
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score < 20) return 'LOW';
    if (score < 50) return 'MEDIUM';
    if (score < 80) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Get or create user profile
   */
  private getUserProfile(userId: string): UserBehaviorProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  /**
   * Create new user profile
   */
  private createUserProfile(userId: string): UserBehaviorProfile {
    const profile: UserBehaviorProfile = {
      userId,
      typicalLocations: [],
      typicalDevices: [],
      typicalTimes: [],
      averageSessionDuration: 1800000, // 30 minutes
      typicalActions: [],
      riskThreshold: 50,
      lastLoginLocation: '',
      lastLoginTime: new Date()
    };

    this.userProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Update user profile with new activity
   */
  private updateUserProfile(profile: UserBehaviorProfile, ipAddress: string, userAgent: string, timestamp: Date): void {
    // Update typical locations (add if new)
    if (!profile.typicalLocations.includes(ipAddress)) {
      profile.typicalLocations.push(ipAddress);
    }

    // Update typical devices
    if (!profile.typicalDevices.includes(userAgent)) {
      profile.typicalDevices.push(userAgent);
    }

    // Update typical times
    const hour = timestamp.getHours();
    if (!profile.typicalTimes.includes(hour)) {
      profile.typicalTimes.push(hour);
    }

    // Update last login info
    profile.lastLoginLocation = ipAddress;
    profile.lastLoginTime = timestamp;
  }

  /**
   * Log activity for analysis
   */
  private logActivity(sessionId: string, path: string, ipAddress: string, userAgent: string, score: number, timestamp: Date): void {
    const activity: ActivityLog = {
      sessionId,
      path,
      ipAddress,
      userAgent,
      score,
      timestamp
    };

    if (!this.sessionActivity.has(sessionId)) {
      this.sessionActivity.set(sessionId, []);
    }

    this.sessionActivity.get(sessionId)!.push(activity);

    // Keep only last 100 activities per session
    const activities = this.sessionActivity.get(sessionId)!;
    if (activities.length > 100) {
      activities.splice(0, activities.length - 100);
    }
  }

  /**
   * Get recent activity for user
   */
  private getRecentActivity(userId: string, timeWindow: number): ActivityLog[] {
    const allActivities: ActivityLog[] = [];
    
    for (const activities of this.sessionActivity.values()) {
      const userActivities = activities.filter(a => 
        a.timestamp.getTime() > Date.now() - timeWindow
      );
      allActivities.push(...userActivities);
    }

    return allActivities;
  }

  /**
   * Get session ID from request
   */
  private getSessionId(req: Request): string {
    return req.get('X-Session-ID') || crypto.randomBytes(16).toString('hex');
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
   * Get geo location for IP
   */
  private async getGeoLocation(ipAddress: string): Promise<GeoLocation | null> {
    if (this.geoLocationCache.has(ipAddress)) {
      return this.geoLocationCache.get(ipAddress)!;
    }

    try {
      // Mock geo location service - in production, use a real service like MaxMind
      const mockLocation: GeoLocation = {
        country: this.getCountryFromIP(ipAddress),
        city: 'Unknown',
        latitude: Math.random() * 180 - 90,
        longitude: Math.random() * 360 - 180
      };

      this.geoLocationCache.set(ipAddress, mockLocation);
      return mockLocation;
    } catch (error) {
      console.error('Geo location lookup failed:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two locations
   */
  private calculateDistance(loc1: GeoLocation, loc2: GeoLocation): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(loc2.latitude - loc1.latitude);
    const dLon = this.deg2rad(loc2.longitude - loc1.longitude);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(loc1.latitude)) * Math.cos(this.deg2rad(loc2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private getCountryFromIP(ip: string): string {
    // Mock implementation - in production, use a real IP geolocation service
    const ipParts = ip.split('.');
    const firstOctet = parseInt(ipParts[0]);
    
    if (firstOctet >= 1 && firstOctet <= 50) return 'US';
    if (firstOctet >= 51 && firstOctet <= 100) return 'GB';
    if (firstOctet >= 101 && firstOctet <= 150) return 'AE';
    if (firstOctet >= 151 && firstOctet <= 200) return 'IN';
    return 'Unknown';
  }

  /**
   * Initialize reputation data
   */
  private initializeReputationData(): void {
    // Mock reputation data - in production, use a real reputation service
    this.ipReputation.set('192.168.1.1', 10); // Good IP
    this.ipReputation.set('10.0.0.1', 5);     // Good IP
    this.ipReputation.set('127.0.0.1', 0);    // Localhost
  }

  /**
   * Get fraud statistics
   */
  public getFraudStatistics(timeWindow: number = 24 * 60 * 60 * 1000): {
    totalChecks: number;
    averageScore: number;
    riskDistribution: Record<string, number>;
    topFraudFactors: Array<{ factor: string; count: number }>;
  } {
    const cutoffTime = Date.now() - timeWindow;
    const allActivities: ActivityLog[] = [];
    
    for (const activities of this.sessionActivity.values()) {
      const recentActivities = activities.filter(a => a.timestamp.getTime() > cutoffTime);
      allActivities.push(...recentActivities);
    }

    const totalChecks = allActivities.length;
    const averageScore = allActivities.reduce((sum, a) => sum + a.score, 0) / Math.max(1, totalChecks);
    
    const riskDistribution = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    };

    const factorCounts = new Map<string, number>();

    allActivities.forEach(activity => {
      const riskLevel = this.determineRiskLevel(activity.score);
      riskDistribution[riskLevel]++;
    });

    return {
      totalChecks,
      averageScore,
      riskDistribution,
      topFraudFactors: [] // Would need to track factors separately
    };
  }
}

interface ActivityLog {
  sessionId: string;
  path: string;
  ipAddress: string;
  userAgent: string;
  score: number;
  timestamp: Date;
}

interface GeoLocation {
  country: string;
  city: string;
  latitude: number;
  longitude: number;
}

export default FraudDetectionService;