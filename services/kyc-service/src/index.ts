import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3011

app.use(cors())
app.use(express.json())

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'kyc-service' })
})

// TODO: Implement KYC routes
app.post('/api/kyc/submit', (req, res) => {
    res.json({ id: 'ver_123', status: 'pending', submittedAt: new Date().toISOString() })
})

app.get('/api/kyc/status/:userId', (req, res) => {
    res.json({ id: 'ver_123', userId: req.params.userId, status: 'pending', submittedAt: new Date().toISOString() })
})

app.listen(PORT, () => {
    console.log(`🚀 KYC Service running on port ${PORT}`)
})
