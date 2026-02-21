import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import paymentsRoutes from './routes/payments.js'
import virtualCardsRoutes from './routes/virtual-cards.js'
import taxRoutes from './routes/tax.js'
// import walletRoutes from './routes/wallet.js'
// import { initializeWallet } from '@tripalfa/wallet'

dotenv.config()

const app: ReturnType<typeof express> = express()
const PORT = process.env.PAYMENT_SERVICE_PORT || 3007

// Initialize wallet system
// const { // walletManager } = initializeWallet(app)

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'payment-service' })
})

// API Routes
app.use('/api/payments', paymentsRoutes)
app.use('/api/virtual-cards', virtualCardsRoutes)
app.use('/api/tax', taxRoutes)
// app.use('/api/wallet', walletRoutes(// walletManager))

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[PaymentService] Error:', err)
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Unknown error',
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Payment Service running on port ${PORT}`)
})

export default app