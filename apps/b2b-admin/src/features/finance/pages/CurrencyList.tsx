import { useState, useEffect } from "react";
import { DataTable } from "@tripalfa/ui-components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@tripalfa/ui-components/ui/badge";
import { Button } from "@tripalfa/ui-components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@tripalfa/ui-components/ui/dialog";
import { Input } from "@tripalfa/ui-components/ui/input";
import { Label } from "@tripalfa/ui-components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@tripalfa/ui-components/ui/select";
import { Switch } from "@tripalfa/ui-components/ui/switch";
import { 
  RefreshCw, 
  Settings2, 
  Star, 
  MoreHorizontal,
  Pencil
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@tripalfa/ui-components/ui/dropdown-menu";
import { Currency, currencyService, RoundingMode, UpdateCurrencyRequest } from "../../../services/CurrencyService";

export interface CurrencyRecord {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  exchangeRate: number | null;
  bufferPercentage: number | null;
  decimalPrecision: number;
  roundingMode: RoundingMode;
  isBaseCurrency: boolean;
  isActive: boolean;
}

// Table columns configuration
export const columns: ColumnDef<CurrencyRecord>[] = [
  {
    accessorKey: "code",
    header: "Currency",
    cell: ({ row }) => {
      const code = row.getValue("code") as string;
      const symbol = row.original.symbol;
      const isBase = row.original.isBaseCurrency;
      
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold">
            {symbol || code.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{code}</span>
              {isBase && (
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            <span className="text-xs text-slate-500">{row.original.name}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "exchangeRate",
    header: "Exchange Rate",
    cell: ({ row }) => {
      const rate = row.getValue("exchangeRate") as number | null;
      const isBase = row.original.isBaseCurrency;
      
      if (isBase) {
        return <span className="text-slate-400">1.00</span>;
      }
      
      return rate ? (
        <span className="font-mono">{rate.toFixed(6)}</span>
      ) : (
        <span className="text-slate-400">N/A</span>
      );
    },
  },
  {
    accessorKey: "bufferPercentage",
    header: "Buffer %",
    cell: ({ row }) => {
      const buffer = row.getValue("bufferPercentage") as number | null;
      const isBase = row.original.isBaseCurrency;
      
      if (isBase) {
        return <span className="text-slate-400">-</span>;
      }
      
      return buffer !== null && buffer > 0 ? (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          +{buffer}%
        </Badge>
      ) : (
        <span className="text-slate-400">0%</span>
      );
    },
  },
  {
    accessorKey: "effectiveRate",
    header: "Effective Rate",
    cell: ({ row }) => {
      const rate = row.original.exchangeRate as number | null;
      const buffer = row.original.bufferPercentage as number | null;
      const isBase = row.original.isBaseCurrency;
      
      if (isBase || !rate) {
        return <span className="text-slate-400">1.00</span>;
      }
      
      const effectiveRate = rate * (1 + (buffer || 0) / 100);
      return (
        <span className="font-mono font-semibold text-indigo-600">
          {effectiveRate.toFixed(6)}
        </span>
      );
    },
  },
  {
    accessorKey: "decimalPrecision",
    header: "Precision",
    cell: ({ row }) => {
      const precision = row.getValue("decimalPrecision") as number;
      
      return (
        <span className="text-sm">
          {precision} decimal{precision !== 1 ? 's' : ''}
        </span>
      );
    },
  },
  {
    accessorKey: "roundingMode",
    header: "Rounding",
    cell: ({ row }) => {
      const mode = row.getValue("roundingMode") as string;
      
      const modeLabels: Record<string, string> = {
        HALF_UP: 'Half Up',
        HALF_DOWN: 'Half Down',
        BANKERS: "Banker's",
        HALF_ODD: 'Half Odd',
        DOWN: 'Round Down',
        UP: 'Round Up',
        CEILING: 'Ceiling',
        FLOOR: 'Floor',
      };
      
      return (
        <Badge variant="secondary">
          {modeLabels[mode] || mode}
        </Badge>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      
      return (
        <Badge variant={isActive ? "default" : "destructive"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const currency = row.original;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => {
                // Open edit dialog
                const event = new CustomEvent('editCurrency', { detail: currency });
                window.dispatchEvent(event);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Settings
            </DropdownMenuItem>
            {!currency.isBaseCurrency && (
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => {
                  const event = new CustomEvent('setBaseCurrency', { detail: currency.id });
                  window.dispatchEvent(event);
                }}
              >
                <Star className="mr-2 h-4 w-4" />
                Set as Base
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function CurrencyListPage() {
  const [data, setData] = useState<CurrencyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CurrencyRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [bufferPercentage, setBufferPercentage] = useState<number>(0);
  const [decimalPrecision, setDecimalPrecision] = useState<number>(2);
  const [roundingMode, setRoundingMode] = useState<RoundingMode>('HALF_UP');
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    loadCurrencies();
    
    // Listen for edit events
    const handleEditCurrency = (event: CustomEvent<CurrencyRecord>) => {
      openEditDialog(event.detail);
    };
    
    const handleSetBaseCurrency = (event: CustomEvent<string>) => {
      handleSetBase(event.detail);
    };
    
    window.addEventListener('editCurrency', handleEditCurrency as EventListener);
    window.addEventListener('setBaseCurrency', handleSetBaseCurrency as EventListener);
    
    return () => {
      window.removeEventListener('editCurrency', handleEditCurrency as EventListener);
      window.removeEventListener('setBaseCurrency', handleSetBaseCurrency as EventListener);
    };
  }, []);

  const loadCurrencies = async () => {
    try {
      setLoading(true);
      const currencies = await currencyService.getCurrencies();
      
      const transformedData: CurrencyRecord[] = currencies.map((c: Currency) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        exchangeRate: c.exchangeRate,
        bufferPercentage: c.bufferPercentage,
        decimalPrecision: c.decimalPrecision,
        roundingMode: c.roundingMode,
        isBaseCurrency: c.isBaseCurrency,
        isActive: c.isActive,
      }));
      
      setData(transformedData);
    } catch (err) {
      console.error('Error loading currencies:', err);
      setError('Failed to load currencies');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshRates = async () => {
    setRefreshing(true);
    try {
      const result = await currencyService.refreshExchangeRates();
      if (result.success) {
        await loadCurrencies();
      }
    } catch (err) {
      console.error('Error refreshing rates:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const openEditDialog = (currency: CurrencyRecord) => {
    setEditingCurrency(currency);
    setBufferPercentage(currency.bufferPercentage || 0);
    setDecimalPrecision(currency.decimalPrecision);
    setRoundingMode(currency.roundingMode);
    setIsActive(currency.isActive);
    setDialogOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!editingCurrency) return;
    
    try {
      const request: UpdateCurrencyRequest = {
        id: editingCurrency.id,
        bufferPercentage: bufferPercentage,
        decimalPrecision: decimalPrecision,
        roundingMode: roundingMode,
        isActive: isActive,
      };
      
      await currencyService.updateCurrencySettings(request);
      await loadCurrencies();
      setDialogOpen(false);
      setEditingCurrency(null);
    } catch (err) {
      console.error('Error saving currency settings:', err);
    }
  };

  const handleSetBase = async (id: string) => {
    try {
      await currencyService.setBaseCurrency(id);
      await loadCurrencies();
    } catch (err) {
      console.error('Error setting base currency:', err);
    }
  };

  const roundingModes = currencyService.getRoundingModes();

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Currency Management</h1>
          <p className="text-slate-500 mt-1">
            Manage currencies, exchange rates, and rounding settings
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefreshRates}
          disabled={refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Rates'}
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold">Currency Settings</h2>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Configure buffer percentages for ROE fluctuations, decimal precision, and rounding modes for each currency.
          The effective rate is calculated as: <code className="bg-slate-100 px-1 py-0.5 rounded">Base Rate × (1 + Buffer %)</code>
        </p>
      </div>

      <DataTable 
        columns={columns} 
        data={data} 
        searchKey="code"
        loading={loading}
      />

      {/* Edit Currency Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Currency Settings</DialogTitle>
            <DialogDescription>
              Configure settings for {editingCurrency?.code} - {editingCurrency?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Buffer Percentage */}
            <div className="grid gap-2">
              <Label htmlFor="buffer">Buffer Percentage (%)</Label>
              <Input
                id="buffer"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={bufferPercentage}
                onChange={(e) => setBufferPercentage(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500">
                Additional percentage added to exchange rate for ROE fluctuations
              </p>
            </div>

            {/* Decimal Precision */}
            <div className="grid gap-2">
              <Label htmlFor="precision">Decimal Precision</Label>
              <Select 
                value={decimalPrecision.toString()} 
                onValueChange={(v) => setDecimalPrecision(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6].map((p) => (
                    <SelectItem key={p} value={p.toString()}>
                      {p} decimal{p !== 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Number of decimal places for this currency
              </p>
            </div>

            {/* Rounding Mode */}
            <div className="grid gap-2">
              <Label htmlFor="rounding">Rounding Mode</Label>
              <Select 
                value={roundingMode} 
                onValueChange={(v) => setRoundingMode(v as RoundingMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roundingModes.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      <div className="flex flex-col">
                        <span>{mode.label}</span>
                        <span className="text-xs text-slate-500">{mode.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
