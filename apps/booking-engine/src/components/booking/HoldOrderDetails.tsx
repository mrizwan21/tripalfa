import React, { useState, useEffect } from "react";
import "./HoldOrderDetails.css";

interface HoldOrder {
  id: string;
  orderId: string;
  reference: string;
  status: "active" | "expired" | "paid" | "cancelled";
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  paymentRequiredBy: string;
  priceGuaranteeExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface HoldOrderDetailsProps {
  holdOrder: HoldOrder;
  onCancelClick?: () => void;
  onCheckPriceClick?: () => void;
  loading?: boolean;
}

const HoldOrderDetails: React.FC<HoldOrderDetailsProps> = ({
  holdOrder,
  onCancelClick,
  onCheckPriceClick,
  loading = false,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isPriceGuaranteeExpired, setIsPriceGuaranteeExpired] = useState(false);

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const deadline = new Date(holdOrder.paymentRequiredBy);
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Expired");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    };

    const checkPriceGuarantee = () => {
      if (holdOrder.priceGuaranteeExpiresAt) {
        const now = new Date();
        const expiry = new Date(holdOrder.priceGuaranteeExpiresAt);
        setIsPriceGuaranteeExpired(expiry < now);
      }
    };

    updateTimeRemaining();
    checkPriceGuarantee();

    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [holdOrder]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "badge-active";
      case "paid":
        return "badge-paid";
      case "expired":
        return "badge-expired";
      case "cancelled":
        return "badge-cancelled";
      default:
        return "badge-default";
    }
  };

  const getPaymentStatusBadgeClass = (status: string) => {
    switch (status) {
      case "awaiting_payment":
        return "badge-warning";
      case "completed":
        return "badge-success";
      case "failed":
        return "badge-error";
      default:
        return "badge-default";
    }
  };

  return (
    <div className="hold-order-details">
      <div className="details-header">
        <div className="header-content">
          <h2>Hold Order Details</h2>
          <p className="order-reference">Order: {holdOrder.reference}</p>
        </div>
        <div className="status-badges">
          <span className={`badge ${getStatusBadgeClass(holdOrder.status)}`}>
            {holdOrder.status.toUpperCase()}
          </span>
          <span
            className={`badge ${getPaymentStatusBadgeClass(holdOrder.paymentStatus)}`}
          >
            {holdOrder.paymentStatus.replace("_", " ").toUpperCase()}
          </span>
        </div>
      </div>

      <div className="details-grid gap-4">
        {/* Pricing Section */}
        <section className="detail-section pricing">
          <h3>Pricing</h3>
          <div className="detail-item">
            <span className="label">Total Amount:</span>
            <span className="value amount">
              {holdOrder.totalAmount} {holdOrder.currency}
            </span>
          </div>
        </section>

        {/* Deadline Section */}
        <section className="detail-section deadline">
          <h3>Payment Deadline</h3>
          <div className="detail-item">
            <span className="label">Pay By:</span>
            <span className="value date">
              {formatDate(holdOrder.paymentRequiredBy)}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Time Remaining:</span>
            <span
              className={`value time-remaining ${timeRemaining === "Expired" ? "expired" : ""}`}
            >
              {timeRemaining}
            </span>
          </div>
        </section>

        {/* Price Guarantee Section */}
        {holdOrder.priceGuaranteeExpiresAt && (
          <section className="detail-section guarantee">
            <h3>Price Guarantee</h3>
            <div className="detail-item">
              <span className="label">Expires:</span>
              <span
                className={`value date ${isPriceGuaranteeExpired ? "expired" : ""}`}
              >
                {formatDate(holdOrder.priceGuaranteeExpiresAt)}
              </span>
            </div>
            {isPriceGuaranteeExpired && (
              <div className="alert-warning">
                Price guarantee has expired. Price may have changed.
              </div>
            )}
          </section>
        )}

        {/* Timestamps */}
        <section className="detail-section timestamps">
          <h3>Timeline</h3>
          <div className="detail-item">
            <span className="label">Created:</span>
            <span className="value date">
              {formatDate(holdOrder.createdAt)}
            </span>
          </div>
          <div className="detail-item">
            <span className="label">Last Updated:</span>
            <span className="value date">
              {formatDate(holdOrder.updatedAt)}
            </span>
          </div>
        </section>
      </div>

      {/* Action Buttons */}
      {holdOrder.status === "active" &&
        holdOrder.paymentStatus === "awaiting_payment" && (
          <div className="action-buttons">
            <div className="hold-payment-info">
              <h4>✓ Your hold is confirmed</h4>
              <p>
                No payment has been deducted from your wallet. Complete payment
                anytime before the deadline to finalize your booking.
              </p>
            </div>
            <button
              className="btn btn-secondary px-4 py-2 rounded-md text-sm font-medium"
              onClick={onCheckPriceClick}
              disabled={loading}
            >
              {loading ? "Checking..." : "Check Latest Price"}
            </button>
            <button
              className="btn btn-outline px-4 py-2 rounded-md text-sm font-medium"
              onClick={onCancelClick}
              disabled={loading}
            >
              Cancel Hold
            </button>
          </div>
        )}

      {holdOrder.status === "paid" && (
        <div className="success-message">
          <p>
            ✓ Your booking has been confirmed and paid. Check your email for
            confirmations and booking documents.
          </p>
        </div>
      )}

      {holdOrder.status === "expired" && (
        <div className="alert-error">
          <p>This hold order has expired. You need to create a new booking.</p>
        </div>
      )}

      {/* Warning for soon-to-expire */}
      {holdOrder.status === "active" &&
        timeRemaining !== "" &&
        !timeRemaining.includes("-") && (
          <div className="alert-info">
            <p>
              ⏱ Payment must be completed by{" "}
              {formatDate(holdOrder.paymentRequiredBy)}
            </p>
          </div>
        )}
    </div>
  );
};

export default HoldOrderDetails;
