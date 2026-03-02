/**
 * CorporateLoyaltyAccounts Component
 *
 * B2B Admin panel for managing Duffel loyalty programme accounts.
 * Allows corporate customers to add, view, and delete loyalty accounts
 * that are used for frequent flyer benefits in flight bookings.
 *
 * Documentation: https://duffel.com/docs/guides/adding-corporate-loyalty-programme-accounts
 */

import { useState, useCallback, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Trash2,
  Search,
  AlertCircle,
  Plane,
  Building2,
  Star,
  Loader2,
  X,
  Save,
  Edit2,
} from "lucide-react";
import { Button } from "@tripalfa/ui-components/ui/button";
import { Input } from "@tripalfa/ui-components/ui/input";
import { Label } from "@tripalfa/ui-components/ui/label";
import { Badge } from "@tripalfa/ui-components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@tripalfa/ui-components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@tripalfa/ui-components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tripalfa/ui-components/ui/select";
import api from "@/shared/lib/api";

// ============================================================================
// TYPES
// ============================================================================

export interface DuffelLoyaltyAccount {
  id: string;
  airline_iata_code: string;
  account_number: string;
  passenger_id?: string;
  created_at: string;
  updated_at?: string;
}

interface CorporateLoyaltyAccountsProps {
  /** Company ID for filtering accounts */
  companyId?: string;
  /** Callback when loyalty account is added */
  onAccountAdded?: (account: DuffelLoyaltyAccount) => void;
  /** Callback when loyalty account is deleted */
  onAccountDeleted?: (accountId: string) => void;
}

interface LoyaltyAccountFormData {
  airline_iata_code: string;
  account_number: string;
  passenger_id: string;
}

// ============================================================================
// AIRLINES LIST (Common IATA codes for loyalty programs)
// ============================================================================

const COMMON_AIRLINES = [
  { code: "EK", name: "Emirates", program: "Emirates Skywards" },
  { code: "QR", name: "Qatar Airways", program: "Privilege Club" },
  { code: "EY", name: "Etihad Airways", program: "Etihad Guest" },
  { code: "LH", name: "Lufthansa", program: "Miles & More" },
  { code: "BA", name: "British Airways", program: "Executive Club" },
  { code: "AF", name: "Air France", program: "Flying Blue" },
  { code: "KL", name: "KLM", program: "Flying Blue" },
  { code: "SQ", name: "Singapore Airlines", program: "KrisFlyer" },
  { code: "CX", name: "Cathay Pacific", program: "Asia Miles" },
  { code: "QF", name: "Qantas", program: "Qantas Frequent Flyer" },
  { code: "AA", name: "American Airlines", program: "AAdvantage" },
  { code: "UA", name: "United Airlines", program: "MileagePlus" },
  { code: "DL", name: "Delta Air Lines", program: "SkyMiles" },
  { code: "TK", name: "Turkish Airlines", program: "Miles&Smiles" },
  { code: "SV", name: "Saudia", program: "Alfursan" },
  { code: "ET", name: "Ethiopian Airlines", program: "ShebaMiles" },
  { code: "RJ", name: "Royal Jordanian", program: "Royal Club" },
  { code: "G9", name: "Air Arabia", program: "Airewards" },
  { code: "FZ", name: "flydubai", program: "OPEN" },
  { code: "WY", name: "Oman Air", program: "Sindbad" },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface LoyaltyAccountCardProps {
  account: DuffelLoyaltyAccount;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const LoyaltyAccountCard: React.FC<LoyaltyAccountCardProps> = ({
  account,
  onDelete,
  isDeleting,
}) => {
  const airline = COMMON_AIRLINES.find(
    (a) => a.code === account.airline_iata_code,
  );

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center gap-2">
            <Plane className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {airline?.name || account.airline_iata_code}
            </p>
            <p className="text-xs text-muted-foreground">
              {airline?.program || "Loyalty Program"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="default"
          onClick={() => onDelete(account.id)}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-50 text-red-500 transition-all disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Account Number
          </span>
          <span className="text-sm font-mono font-semibold text-foreground">
            {account.account_number}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2 gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Airline Code
          </span>
          <Badge variant="secondary" className="text-xs">
            {account.airline_iata_code}
          </Badge>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CorporateLoyaltyAccounts({
  companyId,
  onAccountAdded,
  onAccountDeleted,
}: CorporateLoyaltyAccountsProps) {
  // State
  const [accounts, setAccounts] = useState<DuffelLoyaltyAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<LoyaltyAccountFormData>({
    airline_iata_code: "",
    account_number: "",
    passenger_id: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch accounts on mount
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/duffel/loyalty-accounts", {
        params: { companyId },
      });

      const data = response.data?.data || response.data || [];
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(
        "[CorporateLoyaltyAccounts] Failed to fetch accounts:",
        err,
      );
      setError(
        err.response?.data?.message || "Failed to load loyalty accounts",
      );
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Filter airlines by search
  const filteredAirlines = searchQuery
    ? COMMON_AIRLINES.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.program.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : COMMON_AIRLINES;

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.airline_iata_code) {
      errors.airline_iata_code = "Please select an airline";
    }

    if (!formData.account_number) {
      errors.account_number = "Account number is required";
    } else if (formData.account_number.length < 4) {
      errors.account_number = "Account number must be at least 4 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) return;

      try {
        setSubmitting(true);

        const response = await api.post("/duffel/loyalty-accounts", {
          airline_iata_code: formData.airline_iata_code,
          account_number: formData.account_number,
          passenger_id: formData.passenger_id || undefined,
        });

        const newAccount = response.data?.data || response.data;

        setAccounts((prev) => [...prev, newAccount]);
        setShowAddDialog(false);
        setFormData({
          airline_iata_code: "",
          account_number: "",
          passenger_id: "",
        });
        setFormErrors({});

        onAccountAdded?.(newAccount);
      } catch (err: any) {
        console.error(
          "[CorporateLoyaltyAccounts] Failed to create account:",
          err,
        );
        setFormErrors({
          submit:
            err.response?.data?.message || "Failed to create loyalty account",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [formData, onAccountAdded],
  );

  // Handle delete
  const handleDelete = useCallback(
    async (accountId: string) => {
      if (
        !window.confirm("Are you sure you want to remove this loyalty account?")
      ) {
        return;
      }

      try {
        setDeletingId(accountId);

        await api.delete(`/duffel/loyalty-accounts/${accountId}`);

        setAccounts((prev) => prev.filter((a) => a.id !== accountId));
        onAccountDeleted?.(accountId);
      } catch (err: any) {
        console.error(
          "[CorporateLoyaltyAccounts] Failed to delete account:",
          err,
        );
        setError(
          err.response?.data?.message || "Failed to delete loyalty account",
        );
      } finally {
        setDeletingId(null);
      }
    },
    [onAccountDeleted],
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground text-xl font-semibold tracking-tight">
              Corporate Loyalty Accounts
            </h3>
            <p className="text-xs text-muted-foreground">
              Manage frequent flyer accounts for corporate bookings
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
          <Button
            variant="outline"
            size="default"
            onClick={clearError}
            className="ml-auto text-red-400 hover:"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Accounts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 bg-muted rounded-lg border border-dashed">
          <div className="w-16 h-16 rounded-full bg-muted/80 flex items-center justify-center mx-auto mb-4 gap-2">
            <CreditCard className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            No loyalty accounts configured
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Add frequent flyer accounts to access corporate benefits
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <LoyaltyAccountCard
              key={account.id}
              account={account}
              onDelete={handleDelete}
              isDeleting={deletingId === account.id}
            />
          ))}
        </div>
      )}

      {/* Info Banner */}
      <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-indigo-900">
              Corporate Loyalty Benefits
            </p>
            <p className="text-xs text-indigo-600 mt-1">
              Adding loyalty programme accounts enables your corporate customers
              to earn miles, access lounge benefits, and receive priority
              boarding on eligible flights.
            </p>
          </div>
        </div>
      </div>

      {/* Add Account Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-600" />
              Add Loyalty Account
            </DialogTitle>
            <DialogDescription>
              Add a frequent flyer account for corporate bookings
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Passenger ID (Optional) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Passenger ID (Optional)
              </Label>
              <Input
                value={formData.passenger_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    passenger_id: e.target.value,
                  }))
                }
                placeholder="Enter passenger ID"
                className="h-9"
              />
            </div>

            {/* Airline Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Airline / Program <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search airlines..."
                  className="h-9 pr-8"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>

              {/* Airline Dropdown */}
              <div className="max-h-48 overflow-y-auto border border-border rounded-lg mt-2">
                {filteredAirlines.map((airline) => (
                  <Button
                    variant="outline"
                    size="default"
                    key={airline.code}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        airline_iata_code: airline.code,
                      }));
                      setSearchQuery("");
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-indigo-50 transition-colors flex items-center justify-between ${
                      formData.airline_iata_code === airline.code
                        ? "bg-indigo-50"
                        : ""
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {airline.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {airline.program}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {airline.code}
                    </Badge>
                  </Button>
                ))}
              </div>

              {formErrors.airline_iata_code && (
                <p className="text-xs text-red-500">
                  {formErrors.airline_iata_code}
                </p>
              )}
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Account Number <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.account_number}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    account_number: e.target.value,
                  }))
                }
                placeholder="Enter membership number"
                className={`h-9 ${formErrors.account_number ? "border-red-300" : ""}`}
              />
              {formErrors.account_number && (
                <p className="text-xs text-red-500">
                  {formErrors.account_number}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {formErrors.submit && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-red-700">
                  {formErrors.submit}
                </span>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                size="sm"
                className="hover:"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Account
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CorporateLoyaltyAccounts;
