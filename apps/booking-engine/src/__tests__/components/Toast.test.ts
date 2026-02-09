import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from '../../components/ui/Toast';

describe('Toast Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Toast.success', () => {
    it('should be a function', () => {
      expect(typeof toast.success).toBe('function');
    });

    it('should accept a string message', () => {
      const message = 'Operation successful';
      expect(() => {
        toast.success(message);
      }).not.toThrow();
    });

    it('should log success message to console', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const message = 'Test success';
      
      toast.success(message);
      
      expect(consoleSpy).toHaveBeenCalledWith('TOAST SUCCESS:', message);
      consoleSpy.mockRestore();
    });

    it('should handle empty strings', () => {
      expect(() => {
        toast.success('');
      }).not.toThrow();
    });

    it('should handle long messages', () => {
      const longMessage = 'a'.repeat(1000);
      expect(() => {
        toast.success(longMessage);
      }).not.toThrow();
    });

    it('should handle special characters', () => {
      const specialMessage = 'Success! @#$%^&*()_+-=[]{}|;:,.<>?';
      expect(() => {
        toast.success(specialMessage);
      }).not.toThrow();
    });

    it('should handle unicode characters', () => {
      const unicodeMessage = '✅ نجح العملية ✓ SUCCESS 成功';
      expect(() => {
        toast.success(unicodeMessage);
      }).not.toThrow();
    });
  });

  describe('Toast.error', () => {
    it('should be a function', () => {
      expect(typeof toast.error).toBe('function');
    });

    it('should accept a string message', () => {
      const message = 'An error occurred';
      expect(() => {
        toast.error(message);
      }).not.toThrow();
    });

    it('should log error message to console', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const message = 'Test error';
      
      toast.error(message);
      
      expect(consoleSpy).toHaveBeenCalledWith('TOAST ERROR:', message);
      consoleSpy.mockRestore();
    });

    it('should handle empty strings', () => {
      expect(() => {
        toast.error('');
      }).not.toThrow();
    });

    it('should handle error messages with stack traces format', () => {
      const errorMessage = 'Error: Failed to fetch data\n  at fetchData (api.ts:123)';
      expect(() => {
        toast.error(errorMessage);
      }).not.toThrow();
    });

    it('should handle error objects converted to strings', () => {
      const error = new Error('Network error');
      expect(() => {
        toast.error(error.message);
      }).not.toThrow();
    });
  });

  describe('Toast.info', () => {
    it('should be a function', () => {
      expect(typeof toast.info).toBe('function');
    });

    it('should accept a string message', () => {
      const message = 'This is informational';
      expect(() => {
        toast.info(message);
      }).not.toThrow();
    });

    it('should log info message to console', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const message = 'Test info';
      
      toast.info(message);
      
      expect(consoleSpy).toHaveBeenCalledWith('TOAST INFO:', message);
      consoleSpy.mockRestore();
    });

    it('should handle empty strings', () => {
      expect(() => {
        toast.info('');
      }).not.toThrow();
    });
  });

  describe('Toast Interface', () => {
    it('should have success, error, and info methods', () => {
      expect(toast).toHaveProperty('success');
      expect(toast).toHaveProperty('error');
      expect(toast).toHaveProperty('info');
    });

    it('should have exactly three methods', () => {
      const methods = Object.keys(toast).filter(
        (key) => typeof (toast as any)[key] === 'function'
      );
      expect(methods).toHaveLength(3);
    });
  });

  describe('Toast Multiple Calls', () => {
    it('should handle multiple consecutive success calls', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      toast.success('First');
      toast.success('Second');
      toast.success('Third');
      
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      consoleSpy.mockRestore();
    });

    it('should handle mixed toast types', () => {
      const successSpy = vi.spyOn(console, 'log');
      const errorSpy = vi.spyOn(console, 'error');
      
      toast.success('Success');
      toast.error('Error');
      toast.info('Info');
      toast.success('Success 2');
      toast.error('Error 2');
      
      expect(successSpy).toHaveBeenCalledTimes(3); // success, info, success
      expect(errorSpy).toHaveBeenCalledTimes(2); // error, error
      
      successSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('Toast Real-world Scenarios', () => {
    it('should notify successful booking creation', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      toast.success('Booking created successfully! Confirmation: BK12345');
      
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0];
      expect(call[1]).toContain('Booking created successfully');
      
      consoleSpy.mockRestore();
    });

    it('should notify payment failure', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      
      toast.error('Payment failed: Card declined. Please use a different card.');
      
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0];
      expect(call[1]).toContain('Payment failed');
      
      consoleSpy.mockRestore();
    });

    it('should notify booking status change', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      toast.info('Your booking status has been updated to CONFIRMED');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should notify network error', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      
      toast.error('Network error: Unable to connect to server. Please check your connection.');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should notify refund notification', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      toast.success('Refund processed: $250.00 will be returned to your account within 5 business days');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Toast Edge Cases', () => {
    it('should handle rapid successive calls', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      for (let i = 0; i < 10; i++) {
        toast.success(`Message ${i}`);
      }
      
      expect(consoleSpy).toHaveBeenCalledTimes(10);
      consoleSpy.mockRestore();
    });

    it('should handle messages with newlines', () => {
      expect(() => {
        toast.success('Line 1\nLine 2\nLine 3');
      }).not.toThrow();
    });

    it('should handle messages with HTML-like content', () => {
      expect(() => {
        toast.info('<div>This is not HTML</div>');
      }).not.toThrow();
    });

    it('should handle JSON strings', () => {
      const jsonMessage = JSON.stringify({ status: 'success', message: 'Done' });
      expect(() => {
        toast.success(jsonMessage);
      }).not.toThrow();
    });
  });
});
