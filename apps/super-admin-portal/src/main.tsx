import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Buffer } from 'buffer'
import './index.css'
import AppRouter from './AppRouter.tsx'

if (typeof window !== 'undefined') {
  window.Buffer = Buffer
}

const tripAlfaQueryDefaults = {
  staleTime: 60_000,
  gcTime: 300_000,
  retry: 1,
  refetchOnWindowFocus: false,
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: tripAlfaQueryDefaults,
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  </StrictMode>,
)
