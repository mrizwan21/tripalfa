/**
 * PriceChangeDialog Component
 * 
 * Displays a warning dialog when flight price has changed before booking confirmation.
 * Allows users to accept the new price or cancel the booking.
 * 
 * Part of the "Getting An Accurate Price Before Booking" implementation.
 * Documentation: https://duffel.com/docs/guides/getting-an-accurate-price-before-booking
 */

import React from 'react';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
  X,
  Check,
} from 'lucide-react';
import { Button } from '../ui/button';
import type { PriceVerificationResult } from '../../services/priceVerificationService';

// ============================================================================
// TYPES
// ============================================================================

interface PriceChangeDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Price verification result */
  verificationResult: PriceVerificationResult | null;
  /** Callback when user accepts the new price */
  onAccept: () => void;
  /** Callback when user cancels */
  onCancel: () => void;
  /** Callback to refresh price */
  onRefresh?: () => void;
  /** Whether refresh is in progress */
  isRefreshing?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PriceChangeDialog({
  isOpen,
  verificationResult,
  onAccept,
  onCancel,
  onRefresh,
  isRefreshing = false,
  className = '',
}: PriceChangeDialogProps) {
  if (!isOpen || !verificationResult) return null;

  const { priceChanged, priceDifference, originalPrice, newPrice, expiresAt } = verificationResult;

  // No price change - show confirmation dialog
  if (!priceChanged) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-green-50 px-8 py-6 border-b border-green-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check size={24} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Price Verified</h2>
                <p className="text-sm text-gray-500">The price has been confirmed</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500">Total Price</span>
                <span className="text-2xl font-black text-gray-900">
                  {newPrice?.currency} {newPrice?.amount}
                </span>
              </div>
            </div>

            {expiresAt && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Clock size={14} />
                <span>Valid until {new Date(expiresAt).toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-8 py-4 bg-gray-50 flex gap-3">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 h-12 rounded-xl text-sm font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={onAccept}
              className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold"
            >
              Continue Booking
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Price increased
  const priceIncreased = priceDifference?.increased ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-[2rem] shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${className}`}>
        {/* Header */}
        <div className={`${priceIncreased ? 'bg-amber-50' : 'bg-green-50'} px-8 py-6 border-b ${priceIncreased ? 'border-amber-100' : 'border-green-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${priceIncreased ? 'bg-amber-100' : 'bg-green-100'} flex items-center justify-center`}>
                {priceIncreased ? (
                  <TrendingUp size={24} className="text-amber-600" />
                ) : (
                  <TrendingDown size={24} className="text-green-600" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">
                  {priceIncreased ? 'Price Increased' : 'Price Decreased'}
                </h2>
                <p className="text-sm text-gray-500">
                  {priceIncreased ? 'The fare has changed since you selected this flight' : 'Great news! The price has dropped'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {/* Price Comparison */}
          <div className="space-y-3 mb-6">
            {/* Original Price */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-400">Original Price</span>
              <span className="text-lg font-bold text-gray-400 line-through">
                {originalPrice?.currency} {originalPrice?.amount}
              </span>
            </div>

            {/* New Price */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-bold text-gray-900">New Price</span>
              <span className={`text-2xl font-black ${priceIncreased ? 'text-amber-600' : 'text-green-600'}`}>
                {newPrice?.currency} {newPrice?.amount}
              </span>
            </div>

            {/* Difference */}
            <div className={`flex items-center justify-between py-3 px-4 rounded-xl ${priceIncreased ? 'bg-amber-50' : 'bg-green-50'}`}>
              <span className="text-sm font-bold text-gray-700">Price Difference</span>
              <div className="text-right">
                <span className={`text-lg font-black ${priceIncreased ? 'text-amber-600' : 'text-green-600'}`}>
                  {priceIncreased ? '+' : '-'}{newPrice?.currency} {priceDifference?.amount.toFixed(2)}
                </span>
                <span className={`ml-2 text-xs font-bold ${priceIncreased ? 'text-amber-500' : 'text-green-500'}`}>
                  ({priceDifference?.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          {priceIncreased && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 mb-6">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  Flight prices change frequently
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Airlines update their fares in real-time. The new price reflects the current market rate.
                </p>
              </div>
            </div>
          )}

          {/* Expiry */}
          {expiresAt && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} />
              <span>Offer valid until {new Date(expiresAt).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-8 py-4 bg-gray-50 flex gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 h-12 rounded-xl text-sm font-bold"
          >
            Cancel
          </Button>
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="outline"
              disabled={isRefreshing}
              className="h-12 rounded-xl text-sm font-bold px-4"
            >
              {isRefreshing ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
            </Button>
          )}
          <Button
            onClick={onAccept}
            className={`flex-1 h-12 ${priceIncreased ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-xl text-sm font-bold`}
          >
            {priceIncreased ? 'Accept New Price' : 'Continue with Savings'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PriceChangeDialog;