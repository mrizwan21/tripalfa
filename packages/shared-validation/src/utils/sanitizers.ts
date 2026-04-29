import validator from 'validator';
import xss from 'xss';

/**
 * Sanitization options
 */
export interface SanitizeOptions {
  /**
   * Whether to trim whitespace
   */
  trim?: boolean;
  
  /**
   * Whether to convert to lowercase
   */
  lowercase?: boolean;
  
  /**
   * Whether to convert to uppercase
   */
  uppercase?: boolean;
  
  /**
   * Maximum length (truncate if exceeded)
   */
  maxLength?: number;
  
  /**
   * Whether to escape HTML
   */
  escapeHtml?: boolean;
  
  /**
   * Whether to strip HTML tags
   */
  stripTags?: boolean;
  
  /**
   * Whether to normalize email
   */
  normalizeEmail?: boolean;
  
  /**
   * Custom sanitizer function
   */
  custom?: (value: string) => string;
}

/**
 * Sanitize a string value
 */
export const sanitizeString = (
  value: string,
  options: SanitizeOptions = {}
): string => {
  let sanitized = value;
  
  const {
    trim = true,
    lowercase = false,
    uppercase = false,
    maxLength,
    escapeHtml = true,
    stripTags = true,
    normalizeEmail = false,
    custom,
  } = options;
  
  // Trim whitespace
  if (trim) {
    sanitized = sanitized.trim();
  }
  
  // Convert case
  if (lowercase) {
    sanitized = sanitized.toLowerCase();
  }
  
  if (uppercase) {
    sanitized = sanitized.toUpperCase();
  }
  
  // Strip HTML tags
  if (stripTags) {
    sanitized = validator.stripLow(sanitized);
    sanitized = validator.escape(sanitized);
  }
  
  // Escape HTML
  if (escapeHtml) {
    sanitized = xss(sanitized);
  }
  
  // Normalize email
  if (normalizeEmail && validator.isEmail(sanitized)) {
    sanitized = validator.normalizeEmail(sanitized, {
      all_lowercase: true,
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false,
    }) || sanitized;
  }
  
  // Truncate if max length specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Apply custom sanitizer
  if (custom) {
    sanitized = custom(sanitized);
  }
  
  return sanitized;
};

/**
 * Sanitize an object recursively
 */
export const sanitizeObject = <T extends Record<string, any>>(
  obj: T,
  fieldOptions: Record<string, SanitizeOptions> = {},
  defaultOptions: SanitizeOptions = {}
): T => {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const options = fieldOptions[key] || defaultOptions;
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value, options);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value, fieldOptions, defaultOptions);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => {
        if (typeof item === 'string') {
          return sanitizeString(item, options);
        } else if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item, fieldOptions, defaultOptions);
        }
        return item;
      });
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
};

/**
 * Sanitize email address
 */
export const sanitizeEmail = (email: string): string => {
  return sanitizeString(email, {
    trim: true,
    lowercase: true,
    normalizeEmail: true,
    maxLength: 254,
  });
};

/**
 * Sanitize phone number
 */
export const sanitizePhone = (phone: string): string => {
  return sanitizeString(phone, {
    trim: true,
    stripTags: true,
    maxLength: 20,
    custom: (value) => value.replace(/[^\d+]/g, ''),
  });
};

/**
 * Sanitize URL
 */
export const sanitizeUrl = (url: string): string => {
  return sanitizeString(url, {
    trim: true,
    stripTags: true,
    maxLength: 2048,
    custom: (value) => {
      // Ensure URL has protocol
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        return `https://${value}`;
      }
      return value;
    },
  });
};

/**
 * Sanitize text for SQL safety (basic protection)
 */
export const sanitizeSql = (input: string): string => {
  return sanitizeString(input, {
    trim: true,
    stripTags: true,
    escapeHtml: true,
    custom: (value) => {
      // Basic SQL injection protection
      const sqlKeywords = [
        'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION', 'OR', 'AND',
        'WHERE', 'FROM', 'JOIN', 'HAVING', 'GROUP BY', 'ORDER BY', 'LIMIT',
        'OFFSET', 'UNION ALL', 'EXEC', 'EXECUTE', 'TRUNCATE', 'CREATE',
        'ALTER', 'COMMIT', 'ROLLBACK', 'SAVEPOINT'
      ];
      
      let sanitized = value;
      sqlKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        sanitized = sanitized.replace(regex, '');
      });
      
      return sanitized;
    },
  });
};

/**
 * Sanitize HTML content (allow safe HTML)
 */
export const sanitizeHtml = (html: string): string => {
  return xss(html, {
    whiteList: {
      a: ['href', 'title', 'target'],
      b: [],
      blockquote: ['cite'],
      br: [],
      code: [],
      div: [],
      em: [],
      h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
      hr: [],
      i: [],
      img: ['src', 'alt', 'title', 'width', 'height'],
      li: [],
      ol: [],
      p: [],
      pre: [],
      small: [],
      span: [],
      strong: [],
      sub: [],
      sup: [],
      table: ['border', 'cellpadding', 'cellspacing'],
      tbody: [],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
      thead: [],
      tr: [],
      ul: [],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
  });
};

/**
 * Middleware to sanitize request body
 */
export const sanitizeMiddleware = (
  fieldOptions: Record<string, SanitizeOptions> = {},
  defaultOptions: SanitizeOptions = {}
) => {
  return (req: any, res: any, next: any) => {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body, fieldOptions, defaultOptions);
    }
    
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query, fieldOptions, defaultOptions);
    }
    
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params, fieldOptions, defaultOptions);
    }
    
    next();
  };
};