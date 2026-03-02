import { useState, useEffect } from "react";
import { DataTable } from "@tripalfa/ui-components/ui/data-table";
import { columns } from "./columns";
import { PaymentService } from "../../../services/PaymentService";

type FinanceRecord = {
  id: string;
  type: "invoice" | "payment" | "refund" | "charge";
  reference: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  date: string;
  description: string;
};

type PaymentData = {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  bookingId?: string;
  customerId?: string;
  createdAt: string;
  paymentMethod?: string;
  gateway?: string;
};

export default function FinancePage() {
  const [data, setData] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        setLoading(true);
        const payments = await PaymentService.getPayments();

        // Transform payment data to match the expected FinanceRecord interface
        const transformedData: FinanceRecord[] = payments.map(
          (payment: PaymentData) => ({
            id: payment.id,
            type: "payment", // Defaulting to 'payment' as the other types don't map directly to FinanceRecord types
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            reference: payment.bookingId || payment.customerId || payment.id,
            date: payment.createdAt,
            description: `Payment via ${payment.paymentMethod} (${payment.gateway})`,
          }),
        );

        setData(transformedData);
      } catch (err) {
        console.error("Error loading payment data:", err);
        setError("Failed to load payment data");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadPaymentData();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h1 className="text-3xl font-bold">Finance</h1>
      </div>
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <div className="text-sm text-muted-foreground">
          Loading payment data...
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
          No finance records available.
        </div>
      ) : (
        <DataTable columns={columns} data={data} searchKey="reference" />
      )}
    </div>
  );
}
