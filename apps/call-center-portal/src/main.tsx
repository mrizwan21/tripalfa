import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

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
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
