

export interface PaymentData {
    id: string
    amount: number
    currency: string
    status: 'pending' | 'completed' | 'failed'
    paymentMethod: 'card' | 'bank_transfer' | 'wallet'
    gateway: 'stripe' | 'paypal' | 'adyen'
    bookingId?: string
    customerId: string
    createdAt: string
    updatedAt: string
}

export interface VirtualCardData {
    id: string
    cardNumber: string
    expiryDate: string
    cvv: string
    cardholderName: string
    balance: number
    currency: string
    status: 'active' | 'frozen' | 'cancelled'
    isActive: boolean
    isBlocked: boolean
    cardType: 'debit' | 'credit'
    usageType: 'personal' | 'business'
    spendingLimit: number
    createdAt: string
    transactions: PaymentData[]
}

export const PaymentService = {
    getPayments: async (): Promise<PaymentData[]> => {
        // Mock implementation
        return Promise.resolve([
            {
                id: 'pay_1',
                amount: 1000,
                currency: 'USD',
                status: 'completed',
                paymentMethod: 'card',
                gateway: 'stripe',
                customerId: 'cus_1',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ])
    },

    getVirtualCards: async (): Promise<VirtualCardData[]> => {
        // Mock implementation
        return Promise.resolve([])
    },

    createVirtualCard: async (data: any): Promise<VirtualCardData> => {
        return Promise.resolve({
            id: 'vc_1',
            cardNumber: '4242 4242 4242 4242',
            expiryDate: '12/25',
            cvv: '123',
            cardholderName: data.cardholderName || 'Test User',
            balance: 0,
            currency: data.currency || 'USD',
            status: 'active',
            isActive: true,
            isBlocked: false,
            cardType: data.cardType || 'debit',
            usageType: data.usageType || 'business',
            spendingLimit: data.spendingLimit || 1000,
            createdAt: new Date().toISOString(),
            transactions: []
        })
    },

    getVirtualCardStats: async (): Promise<{
        totalCards: number
        activeCards: number
        totalBalance: number
        monthlySpending: number
    }> => {
        // Mock implementation
        return Promise.resolve({
            totalCards: 5,
            activeCards: 4,
            totalBalance: 2500,
            monthlySpending: 1200
        })
    }
}
