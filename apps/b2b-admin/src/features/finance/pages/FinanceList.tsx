import { useState, useEffect } from "react"
import { DataTable } from "@tripalfa/ui-components/ui/data-table"
import { columns, FinanceRecord } from "./columns"
import { PaymentService, PaymentData } from "../../../services/PaymentService"

export default function FinancePage() {
    const [data, setData] = useState<FinanceRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadPaymentData = async () => {
            try {
                setLoading(true)
                const payments = await PaymentService.getPayments()

                // Transform payment data to match the expected FinanceRecord interface
                const transformedData: FinanceRecord[] = payments.map((payment: PaymentData) => ({
                    id: payment.id,
                    type: 'payment', // Defaulting to 'payment' as the other types don't map directly to FinanceRecord types
                    amount: payment.amount,
                    currency: payment.currency,
                    status: payment.status,
                    reference: payment.bookingId || payment.customerId,
                    date: payment.createdAt,
                    description: `Payment via ${payment.paymentMethod} (${payment.gateway})`
                }))

                setData(transformedData)
            } catch (err) {
                console.error('Error loading payment data:', err)
                setError('Failed to load payment data')
                // Fallback to mock data if API fails
                setData([
                    { id: "1", type: "charge" as const, amount: 5000, currency: "USD", status: "completed", reference: "DEP-001", date: "2023-01-01", description: "Deposit" },
                    { id: "2", type: "payment" as const, amount: 150, currency: "USD", status: "completed", reference: "BK-123", date: "2023-01-02", description: "Booking Payment" },
                    { id: "3", type: "refund" as const, amount: 1000, currency: "USD", status: "pending", reference: "WTH-001", date: "2023-01-05", description: "Withdrawal" },
                ])
            } finally {
                setLoading(false)
            }
        }

        loadPaymentData()
    }, [])

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold">Finance</h1>
            </div>
            <DataTable columns={columns} data={data} searchKey="reference" />
        </div>
    )
}
