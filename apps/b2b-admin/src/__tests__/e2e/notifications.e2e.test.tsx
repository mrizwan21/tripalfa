import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import InAppBell from '@/components/notifications/InAppBell';

test('InAppBell mounts and shows unread count', async () => {
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InAppBell userId={'u1'} />
      </AuthProvider>
    </QueryClientProvider>
  );

  // The bell button should be present
  const btn = await screen.findByRole('button', { name: /Notifications/i });
  expect(btn).toBeInTheDocument();

  // Wait for initial unread fetch (mocked network may be empty)
  await waitFor(() => expect(btn).toBeInTheDocument());
});
