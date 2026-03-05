import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "../ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Wallet,
} from "lucide-react";
import { OfflineChangeRequest } from "@tripalfa/shared-types";
import offlineRequestApi from "@/api/offlineRequestApi";
import paymentApi from "@/api/paymentApi";

interface OfflineRequestPaymentProps {
  request: OfflineChangeRequest;
  amount: number;
  currency?: string;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: Error) => void;
}

interface PaymentMethod {
  id: string;
  type: "credit_card" | "wallet" | "debit_card";
  last4: string;
  brand: string;
  isDefault: boolean;
}

interface AvailableMethods {
  creditCards: PaymentMethod[];
  walletBalance: number;
}

export const OfflineRequestPayment: React.FC<OfflineRequestPaymentProps> = ({
  request,
  amount,
  currency = "USD",
  onSuccess,
  onError,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState<AvailableMethods>({
    creditCards: [],
    walletBalance: 0,
  });
  const [step, setStep] = useState<
    "select" | "confirm" | "processing" | "success" | "error"
  >("select");
  const [transactionId, setTransactionId] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async () => {
      // Generate a unique payment ID
      const paymentId = `${request.id}-payment-${Date.now()}`;
      const response = await offlineRequestApi.recordPayment(request.id, {
        paymentId,
        amount,
        method: selectedPaymentMethod,
      });
      return response;
    },
    onSuccess: (response) => {
      setTransactionId(
        response.transactionId || response.payment?.transactionRef || "",
      );
      setStep("success");
      onSuccess?.(response.transactionId || "");
    },
    onError: (err) => {
      const errorMessage =
        err instanceof Error ? err.message : "Payment processing failed";
      setError(errorMessage);
      setStep("error");
      onError?.(err as Error);
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);
  };

  const handlePaymentMethodChange = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const handleProcessPayment = () => {
    if (!selectedPaymentMethod) {
      setError("Please select a payment method");
      return;
    }
    setStep("processing");
    processPaymentMutation.mutate();
  };

  // Render Success State
  if (step === "success") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="mb-4 flex justify-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-green-700 mb-6">
              Your flight change has been confirmed and your new e-ticket is
              being generated.
            </p>

            <div className="bg-card rounded-lg p-6 mb-6 space-y-3 text-left">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Request Reference</span>
                <span className="font-semibold">{request.requestRef}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Booking Reference</span>
                <span className="font-semibold">{request.bookingRef}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(amount)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3 gap-4">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-sm text-foreground">
                  {transactionId}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2 text-xl font-semibold tracking-tight">
                What's Next?
              </h3>
              <ul className="text-sm text-blue-700 space-y-2 text-left">
                <li>✓ Your new e-ticket will be emailed within 15 minutes</li>
                <li>
                  ✓ An updated invoice and receipt will be sent separately
                </li>
                <li>✓ Your original booking has been cancelled</li>
                <li>✓ New ticket reference will be provided in the email</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-4">
                Download Receipt
              </Button>
              <Button className="flex-1 hover: gap-4">
                View Updated Booking
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Error State
  if (step === "error") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-8 pb-8">
            <div className="flex gap-4 mb-4">
              <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 gap-4" />
              <div>
                <h2 className="text-xl font-bold text-red-900 mb-2 text-2xl font-semibold tracking-tight">
                  Payment Failed
                </h2>
                <p className="text-red-700 mb-4">{error}</p>
              </div>
            </div>

            <div className="bg-red-100 border border-red-300 rounded p-4 mb-6">
              <p className="text-sm text-red-900">
                Your request is still active. Please try again with a different
                payment method or contact our support team for assistance.
              </p>
            </div>

            <Button
              onClick={() => {
                setStep("select");
                setError("");
                setSelectedPaymentMethod("");
              }}
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Processing State
  if (step === "processing") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin">
              <Loader2 className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground">
              Processing Payment...
            </p>
            <p className="text-sm text-muted-foreground">
              Please don't close this page
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: Select and Confirm State
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Payment</CardTitle>
          <CardDescription>
            Request Reference: {request.requestRef}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 border-t pt-4">
          <div className="flex justify-between items-center gap-4">
            <span className="text-muted-foreground">Payment Amount</span>
            <span className="text-2xl font-bold text-indigo-700">
              {formatCurrency(amount)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm gap-4">
            <span className="text-muted-foreground">Original Booking</span>
            <span className="font-mono">{request.bookingRef}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-6">
          {/* Credit Card Option */}
          <div
            onClick={() => handlePaymentMethodChange("credit_card")}
            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
              selectedPaymentMethod === "credit_card"
                ? "border-indigo-600 bg-indigo-50"
                : "border-border bg-muted/50 hover:border-border/80"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="mr-3 mt-1">
                <input
                  type="radio"
                  checked={selectedPaymentMethod === "credit_card"}
                  onChange={() => handlePaymentMethodChange("credit_card")}
                  className="w-4 h-4"
                />
              </div>
              <div className="flex-1 gap-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold">Credit Card</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Visa, Mastercard, or American Express
                </p>
              </div>
            </div>
          </div>

          {/* Wallet Option */}
          <div
            onClick={() => handlePaymentMethodChange("wallet")}
            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
              selectedPaymentMethod === "wallet"
                ? "border-indigo-600 bg-indigo-50"
                : "border-border bg-muted/50 hover:border-border/80"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="mr-3 mt-1">
                <input
                  type="radio"
                  checked={selectedPaymentMethod === "wallet"}
                  onChange={() => handlePaymentMethodChange("wallet")}
                  className="w-4 h-4"
                />
              </div>
              <div className="flex-1 gap-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold">TripAlfa Wallet</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Available Balance:{" "}
                  <strong>
                    {formatCurrency(paymentMethods.walletBalance)}
                  </strong>
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 gap-4" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Details Form */}
      {selectedPaymentMethod === "credit_card" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Card Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Cardholder Name
              </label>
              <Input placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Card Number
              </label>
              <Input placeholder="4242 4242 4242 4242" maxLength={19} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Expiry Date
                </label>
                <Input placeholder="MM/YY" maxLength={5} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CVC</label>
                <Input placeholder="123" maxLength={4} type="password" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security & Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>🔒 Your payment is secure</strong>
          <br />
          We use industry-standard encryption to protect your payment
          information. Your card details are never stored on our servers.
        </p>
      </div>

      {/* Confirmation */}
      {step === "confirm" && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-900 mb-4">
              Please confirm that you want to proceed with this payment of{" "}
              <strong>{formatCurrency(amount)}</strong>.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 gap-4">
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (step === "select") {
              setStep("confirm");
            } else if (step === "confirm") {
              handleProcessPayment();
            }
          }}
          disabled={!selectedPaymentMethod || processPaymentMutation.isPending}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-4"
        >
          {processPaymentMutation.isPending && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          {step === "select" ? "Next" : "Complete Payment"}
        </Button>
      </div>
    </div>
  );
};
