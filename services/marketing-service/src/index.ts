import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3012

app.use(cors())
app.use(express.json())

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'marketing-service' })
})

// TODO: Implement Marketing routes

app.listen(PORT, () => {
    console.log(`🚀 Marketing Service running on port ${PORT}`)
})
