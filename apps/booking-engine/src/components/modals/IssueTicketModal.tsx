import React, { useState } from 'react';
import { Ticket, Wallet, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface IssueTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    bookingId: string;
    currency: string;
    amount: number;
    walletBalance: number;
}

export const IssueTicketModal: React.FC<IssueTicketModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    bookingId,
    currency,
    amount,
    walletBalance
}) => {
    const [accepted, setAccepted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async () => {
        setIsProcessing(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        onSubmit();
        setIsProcessing(false);
        onClose();
    };

    const hasInsufficientFunds = walletBalance < amount;

    // Use a custom title component for the modal
    const modalTitle = (
        <div className="flex items-center gap-2 text-indigo-700">
            <Ticket className="w-5 h-5" />
            <span className="font-semibold">Issue Ticket & Voucher</span>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={modalTitle}
            headerClassName="bg-indigo-50 border-b border-indigo-100"
            closeButtonClassName="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100"
        >
            <div className="p-6 space-y-6">
                {/* Product Summary */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Payable</p>
                            <p className="text-3xl font-bold text-gray-900">{currency} {amount.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-medium text-gray-500 mb-1">Wallet Balance</p>
                            <p className={cn(
                                "text-lg font-bold flex items-center justify-end gap-1.5",
                                hasInsufficientFunds ? "text-red-600" : "text-green-600"
                            )}>
                                <Wallet className="w-4 h-4" />
                                {currency} {walletBalance.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {hasInsufficientFunds && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3 text-sm text-red-700">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <p>Insufficient wallet balance. Please top up your wallet to proceed with ticket issuance.</p>
                        </div>
                    )}
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Important Information
                        </h4>
                        <ul className="text-xs text-amber-700 space-y-1.5 list-disc pl-4">
                            <li>Ticket issuance is final and non-reversible.</li>
                            <li>Cancellation and changes are subject to airline penalties.</li>
                            <li>Ensure all passenger details (Name, Passport, DOB) are correct.</li>
                        </ul>
                    </div>

                    <label className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        accepted ? "bg-indigo-50 border-indigo-200" : "bg-white border-gray-200 hover:border-indigo-200"
                    )}>
                        <div className="relative flex items-start">
                            <input
                                type="checkbox"
                                checked={accepted}
                                onChange={(e) => setAccepted(e.target.checked)}
                                className="peer h-4 w-4 mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                disabled={hasInsufficientFunds}
                            />
                        </div>
                        <div className="text-sm select-none">
                            <span className="font-medium text-gray-900">I confirm the details and accept the Terms & Conditions</span>
                            <p className="text-xs text-gray-500 mt-0.5">By proceeding, you agree to the deduction of the total amount from your wallet.</p>
                        </div>
                    </label>
                </div>

                {/* Action Button */}
                <Button
                    onClick={handleSubmit}
                    disabled={!accepted || hasInsufficientFunds || isProcessing}
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-indigo-200"
                    variant="primary"
                >
                    {isProcessing ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing Issuance...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Pay & Issue Ticket
                        </span>
                    )}
                </Button>
            </div>
        </Modal>
    );
};
