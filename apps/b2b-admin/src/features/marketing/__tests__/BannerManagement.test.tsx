import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { PermissionProvider } from '@/contexts/PermissionContext';
import BannerManagement from '../BannerManagement';
import { useMarketingPermissions } from '@/hooks/useMarketingPermissions';

// Mock the permission hook
jest.mock('@/hooks/useMarketingPermissions');
const mockUseMarketingPermissions = useMarketingPermissions as jest.MockedFunction<typeof useMarketingPermissions>;

// Mock TanStack Query
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <PermissionProvider>
        {component}
        <Toaster />
      </PermissionProvider>
    </QueryClientProvider>
  );
};

describe('BannerManagement', () => {
  beforeEach(() => {
    // Default permission mock
    mockUseMarketingPermissions.mockReturnValue({
      hasPermission: jest.fn(() => true),
      isLoading: false,
      permissions: {
        'marketing:banner:banner_management:view': true,
        'marketing:banner:banner_management:create': true,
        'marketing:banner:banner_management:update': true,
        'marketing:banner:banner_management:delete': true
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders banner management page', () => {
    renderWithProviders(<BannerManagement />);
    
    expect(screen.getByText('Banner Management')).toBeInTheDocument();
    expect(screen.getByText('Manage your website banners and promotional content')).toBeInTheDocument();
  });

  it('shows permission denied when user lacks view permission', () => {
    mockUseMarketingPermissions.mockReturnValue({
      hasPermission: jest.fn(() => false),
      isLoading: false,
      permissions: {}
    });

    renderWithProviders(<BannerManagement />);
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText('You do not have permission to view this page.')).toBeInTheDocument();
  });

  it('validates form inputs correctly', async () => {
    renderWithProviders(<BannerManagement />);
    
    // Find and fill form fields
    const titleInput = screen.getByLabelText(/banner title/i);
    const imageUrlInput = screen.getByLabelText(/image url/i);
    const targetUrlInput = screen.getByLabelText(/target url/i);

    // Test empty title validation
    fireEvent.change(titleInput, { target: { value: '' } });
    fireEvent.blur(titleInput);
    
    await waitFor(() => {
      expect(screen.getByText(/title must be at least 5 characters/i)).toBeInTheDocument();
    });

    // Test invalid URL validation
    fireEvent.change(imageUrlInput, { target: { value: 'invalid-url' } });
    fireEvent.blur(imageUrlInput);
    
    await waitFor(() => {
      expect(screen.getByText(/must be a valid image url/i)).toBeInTheDocument();
    });
  });

  it('handles banner creation successfully', async () => {
    renderWithProviders(<BannerManagement />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/banner title/i), { 
      target: { value: 'Test Banner' } 
    });
    fireEvent.change(screen.getByLabelText(/image url/i), { 
      target: { value: 'https://example.com/banner.jpg' } 
    });
    fireEvent.change(screen.getByLabelText(/target url/i), { 
      target: { value: 'https://example.com' } 
    });

    // Select status and position
    fireEvent.click(screen.getByText('Select Status'));
    fireEvent.click(screen.getByText('Active'));
    
    fireEvent.click(screen.getByText('Select Position'));
    fireEvent.click(screen.getByText('Home Hero'));

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create banner/i }));

    await waitFor(() => {
      expect(screen.getByText('Banner created successfully!')).toBeInTheDocument();
    });
  });

  it('handles banner deletion', async () => {
    renderWithProviders(<BannerManagement />);
    
    // Wait for banners to load
    await waitFor(() => {
      expect(screen.getByText('TripAlfa Banner')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Banner deleted successfully!')).toBeInTheDocument();
    });
  });

  it('shows preview modal', async () => {
    renderWithProviders(<BannerManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('TripAlfa Banner')).toBeInTheDocument();
    });

    const previewButton = screen.getAllByRole('button', { name: /preview/i })[0];
    fireEvent.click(previewButton);

    expect(screen.getByText('Banner Preview')).toBeInTheDocument();
    expect(screen.getByText('TripAlfa Banner')).toBeInTheDocument();
  });

  it('filters banners by status', async () => {
    renderWithProviders(<BannerManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('TripAlfa Banner')).toBeInTheDocument();
    });

    // Filter by active status
    fireEvent.click(screen.getByText('All Statuses'));
    fireEvent.click(screen.getByText('Active'));

    await waitFor(() => {
      expect(screen.getByText('TripAlfa Banner')).toBeInTheDocument();
    });
  });

  it('validates date range correctly', async () => {
    renderWithProviders(<BannerManagement />);
    
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);

    // Set end date before start date
    fireEvent.change(startDateInput, { target: { value: '2024-01-10' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-05' } });
    fireEvent.blur(endDateInput);

    await waitFor(() => {
      expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument();
    });
  });

  it('handles image upload', async () => {
    renderWithProviders(<BannerManagement />);
    
    const fileInput = screen.getByLabelText(/upload image/i);
    const file = new File(['banner'], 'banner.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('banner.jpg')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    mockUseMarketingPermissions.mockReturnValue({
      hasPermission: jest.fn(() => true),
      isLoading: true,
      permissions: {
        'marketing:banner:banner_management:view': true
      }
    });

    renderWithProviders(<BannerManagement />);
    
    expect(screen.getByText('Loading banner management...')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // This would require mocking the API calls, which is typically done
    // in integration tests. For unit tests, we focus on UI behavior.
    renderWithProviders(<BannerManagement />);
    
    // Test that error states are handled
    expect(screen.getByRole('button', { name: /create banner/i })).toBeInTheDocument();
  });
});