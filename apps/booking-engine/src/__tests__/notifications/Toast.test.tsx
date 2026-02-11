import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { Toast, type ToastType } from '../../components/ui/Toast';

/**
 * Test suite for Toast Notification component
 * Tests toast appearance, dismissal, stacking, and interactions
 */

// Mock component wrapper for testing
const ToastWrapper: React.FC<{
  toasts: Array<{ id: string; type: ToastType; title: string; message?: string; duration?: number }>;
  onClose: (id: string) => void;
}> = ({ toasts, onClose }) => (
  <div className="fixed top-4 right-4 space-y-2 z-50">
    {toasts.map(toast => (
      <Toast
        key={toast.id}
        id={toast.id}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        duration={toast.duration}
        onClose={onClose}
      />
    ))}
  </div>
);

describe('Toast Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  /**
   * Test 1: Toast appears for new notifications
   * Tests that toast renders when notification is added
   */
  it('should display toast notification when added', () => {
    const onClose = vi.fn();
    const toasts = [
      {
        id: '1',
        type: 'success' as ToastType,
        title: 'Success',
        message: 'Notification test successful',
      },
    ];

    render(<ToastWrapper toasts={toasts} onClose={onClose} />);

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Notification test successful')).toBeInTheDocument();
  });

  /**
   * Test 2: Toast auto-dismisses after timeout
   * Tests that toast is removed after duration expires
   */
  it('should auto-dismiss after specified duration', async () => {
    const onClose = vi.fn();
    const toasts = [
      {
        id: '1',
        type: 'info' as ToastType,
        title: 'Info Toast',
        duration: 3000,
      },
    ];

    render(<ToastWrapper toasts={toasts} onClose={onClose} />);

    expect(screen.getByText('Info Toast')).toBeInTheDocument();

    // Advance time to trigger auto-dismiss
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith('1');
    });
  });

  /**
   * Test 3: Toast can be manually dismissed
   * Tests that toast can be closed with close button
   */
  it('should allow manual dismissal via close button', () => {
    const onClose = vi.fn();
    const toasts = [
      {
        id: '1',
        type: 'warning' as ToastType,
        title: 'Warning Toast',
        message: 'Pay attention',
      },
    ];

    render(<ToastWrapper toasts={toasts} onClose={onClose} />);

    const closeButton = screen.getByRole('button');
    closeButton.click();

    expect(onClose).toHaveBeenCalledWith('1');
  });

  /**
   * Test 4: Multiple toasts can stack
   * Tests that multiple toasts display simultaneously
   */
  it('should display multiple toasts stacked', () => {
    const onClose = vi.fn();
    const toasts = [
      {
        id: '1',
        type: 'success' as ToastType,
        title: 'First Toast',
      },
      {
        id: '2',
        type: 'error' as ToastType,
        title: 'Second Toast',
      },
      {
        id: '3',
        type: 'info' as ToastType,
        title: 'Third Toast',
      },
    ];

    render(<ToastWrapper toasts={toasts} onClose={onClose} />);

    expect(screen.getByText('First Toast')).toBeInTheDocument();
    expect(screen.getByText('Second Toast')).toBeInTheDocument();
    expect(screen.getByText('Third Toast')).toBeInTheDocument();
  });

  /**
   * Test 5: Toast displays correct type icon
   * Tests that toast shows appropriate icon based on type
   */
  it('should display correct icon for notification type', () => {
    const onClose = vi.fn();

    // Test success toast with success icon
    const { rerender } = render(
      <ToastWrapper
        toasts={[{ id: '1', type: 'success' as ToastType, title: 'Success' }]}
        onClose={onClose}
      />
    );

    // Check for success styling
    const successToast = screen.getByText('Success').closest('div');
    expect(successToast?.className).toContain('emerald');

    // Test error toast with error icon
    rerender(
      <ToastWrapper
        toasts={[{ id: '1', type: 'error' as ToastType, title: 'Error' }]}
        onClose={onClose}
      />
    );

    const errorToast = screen.getByText('Error').closest('div');
    expect(errorToast?.className).toContain('rose');

    // Test warning toast with warning icon
    rerender(
      <ToastWrapper
        toasts={[{ id: '1', type: 'warning' as ToastType, title: 'Warning' }]}
        onClose={onClose}
      />
    );

    const warningToast = screen.getByText('Warning').closest('div');
    expect(warningToast?.className).toContain('amber');

    // Test info toast with info icon
    rerender(
      <ToastWrapper
        toasts={[{ id: '1', type: 'info' as ToastType, title: 'Info' }]}
        onClose={onClose}
      />
    );

    const infoToast = screen.getByText('Info').closest('div');
    expect(infoToast?.className).toContain('blue');
  });

  /**
   * Test 6: Toast displays with priority styling
   * Tests that toast styling reflects the notification type/priority
   */
  it('should apply priority styling based on toast type', () => {
    const onClose = vi.fn();

    const { rerender } = render(
      <ToastWrapper
        toasts={[{ id: '1', type: 'success' as ToastType, title: 'Test' }]}
        onClose={onClose}
      />
    );

    let toast = screen.getByText('Test').closest('div');
    let styles = toast?.className || '';

    // Success should have emerald color
    expect(styles).toContain('emerald');

    // Change to error - should have rose color
    rerender(
      <ToastWrapper
        toasts={[{ id: '1', type: 'error' as ToastType, title: 'Test' }]}
        onClose={onClose}
      />
    );

    toast = screen.getByText('Test').closest('div');
    styles = toast?.className || '';
    expect(styles).toContain('rose');

    // Change to warning - should have amber color
    rerender(
      <ToastWrapper
        toasts={[{ id: '1', type: 'warning' as ToastType, title: 'Test' }]}
        onClose={onClose}
      />
    );

    toast = screen.getByText('Test').closest('div');
    styles = toast?.className || '';
    expect(styles).toContain('amber');
  });

  /**
   * Test 7: Toast click navigates to details
   * Tests that clicking toast can trigger navigation callback
   */
  it('should handle click action for navigation', () => {
    const onClose = vi.fn();
    const onClick = vi.fn();

    // Re-render to include onClick handler
    const { container } = render(
      <div className="fixed top-4 right-4 z-50">
        <Toast
          id="1"
          type="info"
          title="Click me"
          message="Open details"
          onClose={onClose}
          onClick={onClick}
        />
      </div>
    );

    const toastElement = container.querySelector('[class*="bg-blue"]');
    if (toastElement) {
      toastElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }

    expect(onClick).toHaveBeenCalled();
  });

  /**
   * Additional test: Toast without message
   * Tests that toast works with only title
   */
  it('should display toast with only title', () => {
    const onClose = vi.fn();
    const toasts = [
      {
        id: '1',
        type: 'success' as ToastType,
        title: 'Success!',
      },
    ];

    render(<ToastWrapper toasts={toasts} onClose={onClose} />);

    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  /**
   * Additional test: Toast with long message
   * Tests that toast handles long messages gracefully
   */
  it('should handle long messages', () => {
    const onClose = vi.fn();
    const longMessage =
      'This is a very long message that should wrap across multiple lines if the toast component supports it properly';

    const toasts = [
      {
        id: '1',
        type: 'warning' as ToastType,
        title: 'Long Message',
        message: longMessage,
      },
    ];

    render(<ToastWrapper toasts={toasts} onClose={onClose} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  /**
   * Additional test: Multiple dismissals
   * Tests that multiple toasts can be dismissed independently
   */
  it('should dismiss toasts independently', () => {
    const onClose = vi.fn();
    const toasts = [
      { id: '1', type: 'success' as ToastType, title: 'Toast 1' },
      { id: '2', type: 'error' as ToastType, title: 'Toast 2' },
    ];

    const { rerender } = render(<ToastWrapper toasts={toasts} onClose={onClose} />);

    const buttons = screen.getAllByRole('button');
    buttons[0].click();

    expect(onClose).toHaveBeenCalledWith('1');

    // Remove first toast and verify second is still there
    rerender(
      <ToastWrapper
        toasts={[{ id: '2', type: 'error' as ToastType, title: 'Toast 2' }]}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Toast 2')).toBeInTheDocument();
  });
});
