import { z } from 'zod';

/**
 * Marketing validation utilities and schemas for comprehensive error handling
 */

// Banner validation schema
export const bannerSchema = z.object({
  title: z.string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must not exceed 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_&]+$/, "Title can only contain letters, numbers, spaces, hyphens, underscores, and ampersands"),
  
  status: z.enum(['active', 'scheduled', 'ended', 'draft'] as const),
  
  position: z.enum(['home_hero', 'sidebar', 'footer', 'popup'] as const),
  
  imageUrl: z.string()
    .url("Must be a valid image URL")
    .refine((url) => {
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      return validExtensions.some(ext => url.toLowerCase().endsWith(ext));
    }, "Must be a valid image file format (jpg, jpeg, png, gif, webp, svg)"),
  
  targetUrl: z.string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  
  startDate: z.string()
    .refine((date) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    }, "Must be a valid date"),
  
  endDate: z.string()
    .refine((date) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    }, "Must be a valid date")
    ,
  
  altText: z.string()
    .max(200, "Alt text must not exceed 200 characters")
    .optional(),
  
  priority: z.number()
    .min(1, "Priority must be at least 1")
    .max(100, "Priority must not exceed 100")
    .optional()
});

// Ensure endDate is after startDate at the object level (superRefine supports ctx)
bannerSchema.superRefine((obj, ctx) => {
  const { startDate, endDate } = obj as { startDate?: string; endDate?: string };
  if (!startDate || !endDate) return;
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return; // date format errors handled elsewhere
  if (e <= s) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End date must be after start date",
      path: ["endDate"],
    });
  }
});

// SEO validation schema
export const seoSchema = z.object({
  title: z.string()
    .min(10, "Page title must be at least 10 characters")
    .max(60, "Page title must not exceed 60 characters")
    .regex(/^[a-zA-Z0-9\s\-_&.,:;!?()]+$/, "Page title contains invalid characters"),
  
  description: z.string()
    .min(50, "Meta description must be at least 50 characters")
    .max(160, "Meta description must not exceed 160 characters"),
  
  keywords: z.string()
    .min(5, "Keywords are required")
    .regex(/^[a-zA-Z0-9\s,\-_]+$/, "Keywords can only contain letters, numbers, commas, spaces, hyphens, and underscores"),
  
  canonicalUrl: z.string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  
  robotsIndex: z.boolean(),
  robotsFollow: z.boolean(),
  
  structuredData: z.string()
    .optional()
    .refine((data) => {
      if (!data) return true;
      try {
        JSON.parse(data);
        return true;
      } catch {
        return false;
      }
    }, "Structured data must be valid JSON"),
  
  openGraphTitle: z.string()
    .max(100, "OG title must not exceed 100 characters")
    .optional(),
  
  openGraphDescription: z.string()
    .max(200, "OG description must not exceed 200 characters")
    .optional(),
  
  openGraphImage: z.string()
    .url("Must be a valid image URL")
    .optional()
    .or(z.literal(""))
    .refine((url) => {
      if (!url) return true;
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      return validExtensions.some(ext => url.toLowerCase().endsWith(ext));
    }, "OG image must be a valid image file format"),
  
  twitterCard: z.enum(['summary', 'summary_large_image', 'app', 'player'] as const).optional(),
  twitterSite: z.string().optional(),
  
  schemaOrgType: z.enum(['WebSite', 'Organization', 'LocalBusiness', 'Product', 'Article'] as const).optional()
});

// Social media validation schema
export const socialMediaSchema = z.object({
  platforms: z.array(z.object({
    name: z.enum(['twitter', 'facebook', 'instagram', 'linkedin', 'youtube'] as const),
    enabled: z.boolean(),
    username: z.string()
      .min(1, "Username is required")
      .max(50, "Username must not exceed 50 characters"),
    url: z.string()
      .url("Must be a valid URL"),
    apiKey: z.string().optional(),
    followers: z.number().optional(),
    engagementRate: z.number().min(0).max(100).optional()
  })),
  
  autoPostEnabled: z.boolean(),
  
  postSchedule: z.object({
    enabled: z.boolean(),
    days: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const))
      .min(1, "At least one day must be selected"),
    time: z.string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be a valid time format (HH:MM)"),
    timezone: z.string()
  }),
  
  contentApproval: z.object({
    enabled: z.boolean(),
    requiredApprovals: z.number()
      .min(1, "At least 1 approval is required")
      .max(5, "Maximum 5 approvals allowed"),
    approvers: z.array(z.string().email("Must be a valid email address"))
      .min(1, "At least one approver is required")
  }),
  
  analyticsEnabled: z.boolean(),
  crossPostEnabled: z.boolean()
});

// Marketing campaign validation schema
export const campaignSchema = z.object({
  name: z.string()
    .min(5, "Campaign name must be at least 5 characters")
    .max(100, "Campaign name must not exceed 100 characters"),
  
  type: z.enum(['email', 'social', 'display', 'search', 'affiliate'] as const),
  
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed'] as const),
  
  budget: z.number()
    .min(0, "Budget must be positive")
    .max(1000000, "Budget cannot exceed $1,000,000"),
  
  startDate: z.string()
    .refine((date) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    }, "Must be a valid date"),
  
  endDate: z.string()
    .refine((date) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    }, "Must be a valid date")
    ,
  
  targetAudience: z.object({
    ageRange: z.object({
      min: z.number().min(13).max(100),
      max: z.number().min(13).max(100)
    }).refine(data => data.max > data.min, "Max age must be greater than min age"),
    
    locations: z.array(z.string()).min(1, "At least one location must be specified"),
    
    interests: z.array(z.string()).optional()
  }),
  
  content: z.object({
    headline: z.string().min(10).max(100),
    description: z.string().min(20).max(500),
    callToAction: z.string().min(2).max(20)
  })
});

// Ensure campaign endDate is after startDate
campaignSchema.superRefine((obj, ctx) => {
  const { startDate, endDate } = obj as { startDate?: string; endDate?: string };
  if (!startDate || !endDate) return;
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return;
  if (e <= s) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End date must be after start date",
      path: ["endDate"],
    });
  }
});

/**
 * Validation error formatter
 */
export function formatValidationErrors(errors: z.ZodError): string[] {
  return errors.errors.map(error => {
    const field = error.path.join('.');
    const message = error.message;
    return `${field}: ${message}`;
  });
}

/**
 * Validation result interface
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
  fieldErrors?: Record<string, string>;
}

/**
 * Validate banner data
 */
export function validateBanner(data: any): ValidationResult<any> {
  try {
    const validatedData = bannerSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = formatValidationErrors(error);
      const fieldErrors = error.errors.reduce((acc, curr) => {
        acc[curr.path.join('.')] = curr.message;
        return acc;
      }, {} as Record<string, string>);
      
      return { success: false, errors, fieldErrors };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validate SEO data
 */
export function validateSEO(data: any): ValidationResult<any> {
  try {
    const validatedData = seoSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = formatValidationErrors(error);
      const fieldErrors = error.errors.reduce((acc, curr) => {
        acc[curr.path.join('.')] = curr.message;
        return acc;
      }, {} as Record<string, string>);
      
      return { success: false, errors, fieldErrors };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validate social media data
 */
export function validateSocialMedia(data: any): ValidationResult<any> {
  try {
    const validatedData = socialMediaSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = formatValidationErrors(error);
      const fieldErrors = error.errors.reduce((acc, curr) => {
        acc[curr.path.join('.')] = curr.message;
        return acc;
      }, {} as Record<string, string>);
      
      return { success: false, errors, fieldErrors };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validate campaign data
 */
export function validateCampaign(data: any): ValidationResult<any> {
  try {
    const validatedData = campaignSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = formatValidationErrors(error);
      const fieldErrors = error.errors.reduce((acc, curr) => {
        acc[curr.path.join('.')] = curr.message;
        return acc;
      }, {} as Record<string, string>);
      
      return { success: false, errors, fieldErrors };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Common validation utilities
 */
export const validationUtils = {
  /**
   * Check if URL is valid and secure
   */
  isValidSecureUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
    } catch {
      return false;
    }
  },

  /**
   * Check if image URL is valid
   */
  isValidImageUrl(url: string): boolean {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return validExtensions.some(ext => url.toLowerCase().endsWith(ext));
  },

  /**
   * Sanitize HTML content
   */
  sanitizeHtml(content: string): string {
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
  },

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Check password strength
   */
  checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isValid: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push("Password should be at least 8 characters long");

    if (/[a-z]/.test(password)) score++;
    else feedback.push("Password should contain lowercase letters");

    if (/[A-Z]/.test(password)) score++;
    else feedback.push("Password should contain uppercase letters");

    if (/\d/.test(password)) score++;
    else feedback.push("Password should contain numbers");

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else feedback.push("Password should contain special characters");

    return {
      score,
      feedback,
      isValid: score >= 4
    };
  }
};

/**
 * Error handling utilities
 */
export const errorHandling = {
  /**
   * Handle API errors
   */
  handleApiError(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },

  /**
   * Handle network errors
   */
  handleNetworkError(error: any): string {
    if (error.code === 'NETWORK_ERROR') {
      return 'Network error. Please check your internet connection.';
    }
    if (error.code === 'TIMEOUT') {
      return 'Request timed out. Please try again.';
    }
    return 'A network error occurred';
  },

  /**
   * Log error for debugging
   */
  logError(error: any, context?: string): void {
    console.error(`[Marketing Module Error] ${context || 'Unknown context'}:`, error);
    
    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      console.log('Error would be sent to error tracking service in production');
    }
  }
};

export default {
  bannerSchema,
  seoSchema,
  socialMediaSchema,
  campaignSchema,
  validateBanner,
  validateSEO,
  validateSocialMedia,
  validateCampaign,
  validationUtils,
  errorHandling,
  formatValidationErrors
};