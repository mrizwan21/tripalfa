/** @ts-nocheck */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../components/ui/sonner';
import { Save, RefreshCw, Plus, Trash2, Edit, Check, X, DollarSign, TrendingUp } from 'lucide-react';
import api from '../../lib/api';

// Currency information
// (removed TypeScript-only annotation so ESLint parser won't error)
/** @type {{[code: string]: { symbol: string; name: string; decimalDigits: number }}} */
const CURRENCY_INFO = {
  USD: { symbol: '$', name: 'US Dollar', decimalDigits: 2 },
  EUR: { symbol: '€', name: 'Euro', decimalDigits: 2 },
  GBP: { symbol: '£', name: 'British Pound', decimalDigits: 2 },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', decimalDigits: 2 },
  SAR: { symbol: '﷼', name: 'Saudi Riyal', decimalDigits: 2 },
  INR: { symbol: '₹', name: 'Indian Rupee', decimalDigits: 2 },
  JPY: { symbol: '¥', name: 'Japanese Yen', decimalDigits: 0 },
  AUD: { symbol: 'A$', name: 'Australian Dollar', decimalDigits: 2 },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', decimalDigits: 2 },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', decimalDigits: 2 }
};

interface Currency {
  code: string;
  name: string;
  symbol?: string | null;
  decimal_digits?: number;
  buffer_percentage?: number;
  is_active?: boolean;
}

export function CurrencyManagement() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  /** @type {{[code:string]: number}} */
  const initialExchangeRates = {};
  const [exchangeRates, setExchangeRates] = useState(initialExchangeRates);
  const [isEditing, setIsEditing] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', symbol: '', decimalDigits: 2, bufferPercentage: 0 });
  const [newCurrency, setNewCurrency] = useState({ code: '', name: '', symbol: '', decimalDigits: 2, bufferPercentage: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Untyped aliases (avoid TypeScript-only casts to keep parser happy)
  const anyExchangeRates = exchangeRates || {};

  useEffect(() => {
    loadCurrencies();
    loadExchangeRates();
  }, []);

  const loadCurrencies = async () => {
    try {
      // @ts-ignore
      const result = await api.get('/currencies');
      setCurrencies(result || []);
    } catch (error) {
      console.error('Failed to load currencies:', error);
      toast.error('Failed to load currencies');
    }
  };

  const loadExchangeRates = async () => {
    try {
      // @ts-ignore
      const result = await api.get('/exchange-rates/latest');
      setExchangeRates(result.rates || {});
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
      toast.error('Failed to load exchange rates');
    }
  };

  const handleEdit = (currencyCode) => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (currency) {
      setEditForm({
        name: currency.name,
        symbol: currency.symbol || '',
        decimalDigits: currency.decimal_digits || 2,
        bufferPercentage: currency.buffer_percentage || 0
      });
      setIsEditing(currencyCode);
    }
  };

  const saveEdit = async () => {
    if (!isEditing) return;

    try {
      // @ts-ignore
      await api.post('/currencies', {
        code: isEditing,
        name: editForm.name,
        symbol: editForm.symbol,
        decimal_digits: editForm.decimalDigits,
        buffer_percentage: editForm.bufferPercentage
      });
      
      toast.success('Currency updated successfully');
      setIsEditing(null);
      loadCurrencies();
    } catch (error) {
      console.error('Failed to update currency:', error);
      toast.error('Failed to update currency');
    }
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setEditForm({ name: '', symbol: '', decimalDigits: 2, bufferPercentage: 0 });
  };

  const addCurrency = async () => {
    if (!newCurrency.code || !newCurrency.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // @ts-ignore
      await api.post('/currencies', newCurrency);
      toast.success('Currency added successfully');
      setNewCurrency({ code: '', name: '', symbol: '', decimalDigits: 2, bufferPercentage: 0 });
      loadCurrencies();
    } catch (error) {
      console.error('Failed to add currency:', error);
      toast.error('Failed to add currency');
    }
  };

  const deleteCurrency = async (code) => {
    if (!confirm('Are you sure you want to delete this currency?')) return;

    try {
      // @ts-ignore
      await api.delete(`/currencies/${code}`);
      toast.success('Currency deleted successfully');
      loadCurrencies();
    } catch (error) {
      console.error('Failed to delete currency:', error);
      toast.error('Failed to delete currency');
    }
  };

  const updateExchangeRates = async () => {
    setIsLoading(true);
    try {
      // Fetch latest rates from external API
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (!response.ok) throw new Error('Failed to fetch exchange rates');
      
      const data = await response.json();
      
      // Save to database
      // @ts-ignore
      await api.post('/exchange-rates/save', {
        source: 'exchangerate-api.com',
        base_currency: 'USD',
        rates: data.rates
      });

      toast.success('Exchange rates updated successfully');
      loadExchangeRates();
    } catch (error) {
      console.error('Failed to update exchange rates:', error);
      toast.error('Failed to update exchange rates');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCurrencyActive = async (code, isActive) => {
    try {
      // @ts-ignore
      await api.patch(`/currencies/${code}/toggle`, { is_active: !isActive });
      toast.success(`Currency ${!isActive ? 'activated' : 'deactivated'} successfully`);
      loadCurrencies();
    } catch (error) {
      console.error('Failed to toggle currency:', error);
      toast.error('Failed to toggle currency');
    }
  };

  const applyBuffer = (rate, buffer) => {
    return Number(rate) * (1 + buffer / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Currency Management</h1>
          <p className="text-slate-600">Manage currencies, exchange rates, and conversion buffers for your booking engine</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={updateExchangeRates}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Update Rates
          </Button>
          <Button className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Export Rates
          </Button>
        </div>
      </div>

      {/* Current Exchange Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Current Exchange Rates (Base: USD)
            </span>
            <div className="text-sm text-slate-600">
              Last updated: {new Date().toLocaleString()}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(anyExchangeRates).map(([code, rate]) => {
              const currency = currencies.find(c => c.code === code);
              const buffer = currency?.buffer_percentage || 0;
              const adjustedRate = applyBuffer(Number(rate), buffer);
              const info = CURRENCY_INFO[code] || { symbol: code, name: code, decimalDigits: 2 };
              
              return (
                <div key={code} className="bg-slate-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{code}</span>
                      <span className="text-sm text-slate-600">{info.symbol || code}</span>
                    </div>
                    <span className={'px-2 py-1 rounded text-xs font-medium ' + (buffer > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                      {buffer > 0 ? `+${buffer}% buffer` : 'No buffer'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Base Rate:</span>
                      <span className="font-mono">{(Number(rate) || 0).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-slate-600">With Buffer:</span>
                      <span className="font-mono text-blue-600">{adjustedRate.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{info.name || code}</span>
                      <span>{info.decimalDigits} decimals</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Currency List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Currency Configuration</span>
            <div className="text-sm text-slate-600">
              Configure currency settings and conversion buffers
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add New Currency */}
          <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Currency
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="newCode">Currency Code</Label>
                <Input
                  id="newCode"
                  placeholder="e.g., JPY"
                  value={newCurrency.code}
                  onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <Label htmlFor="newName">Currency Name</Label>
                <Input
                  id="newName"
                  placeholder="e.g., Japanese Yen"
                  value={newCurrency.name}
                  onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="newSymbol">Symbol</Label>
                <Input
                  id="newSymbol"
                  placeholder="e.g., ¥"
                  value={newCurrency.symbol}
                  onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="newDecimals">Decimal Digits</Label>
                <Input
                  id="newDecimals"
                  type="number"
                  min="0"
                  max="4"
                  value={newCurrency.decimalDigits}
                  onChange={(e) => setNewCurrency({ ...newCurrency, decimalDigits: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="newBuffer">Buffer %</Label>
                <Input
                  id="newBuffer"
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={newCurrency.bufferPercentage}
                  onChange={(e) => setNewCurrency({ ...newCurrency, bufferPercentage: parseFloat(e.target.value) })}
                  placeholder="e.g., 2.5"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={addCurrency} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Currency
              </Button>
            </div>
          </div>

          {/* Currency Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Decimals</TableHead>
                <TableHead>Buffer %</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencies.map(curr => (
                <TableRow key={curr.code}>
                  <TableCell className="font-mono font-semibold">{curr.code}</TableCell>
                  <TableCell>
                    {isEditing === curr.code ? (
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    ) : (
                      curr.name
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing === curr.code ? (
                      <Input
                        value={editForm.symbol}
                        onChange={(e) => setEditForm({ ...editForm, symbol: e.target.value })}
                      />
                    ) : (
                      curr.symbol || '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing === curr.code ? (
                      <Input
                        type="number"
                        min="0"
                        max="4"
                        value={editForm.decimalDigits}
                        onChange={(e) => setEditForm({ ...editForm, decimalDigits: parseInt(e.target.value) })}
                      />
                    ) : (
                      curr.decimal_digits || 2
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing === curr.code ? (
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        step="0.1"
                        value={editForm.bufferPercentage}
                        onChange={(e) => setEditForm({ ...editForm, bufferPercentage: parseFloat(e.target.value) })}
                        placeholder="e.g., 2.5"
                      />
                    ) : (
                      <span className={'px-2 py-1 rounded text-sm font-medium ' + ((curr.buffer_percentage ?? 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                        {(curr.buffer_percentage ?? 0)}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={!!curr.is_active}
                      onCheckedChange={() => toggleCurrencyActive(curr.code, !!curr.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isEditing === curr.code ? (
                        <React.Fragment>
                          <Button variant="outline" size="sm" onClick={saveEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </React.Fragment>
                      ) : (
                        <React.Fragment>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(curr.code)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteCurrency(curr.code)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </React.Fragment>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Currency Conversion Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Currency Conversion Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label>Amount</Label>
              <Input type="number" placeholder="100" id="calcAmount" />
            </div>
            <div>
              <Label>From Currency</Label>
                <select id="calcFromCurrency" className="w-full p-2 border rounded">
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>To Currency</Label>
              <select id="calcToCurrency" className="w-full p-2 border rounded">
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  const amountEl = document.getElementById('calcAmount');
                  const amount = parseFloat(((amountEl instanceof HTMLInputElement ? amountEl.value : '') || ''));
                  const fromEl = document.getElementById('calcFromCurrency');
                  const from = (fromEl instanceof HTMLSelectElement ? fromEl.value : '');
                  const toEl = document.getElementById('calcToCurrency');
                  const to = (toEl instanceof HTMLSelectElement ? toEl.value : '');
                       
                  if (isNaN(amount)) {
                    toast.error('Please enter a valid amount');
                    return;
                  }
                  
                  const fromRate = anyExchangeRates[from] || 1;
                  const toRate = anyExchangeRates[to] || 1;
                  const fromCurrency = currencies.find((c) => c.code === from);
                  const toCurrency = currencies.find((c) => c.code === to);
                  
                  const fromBuffer = fromCurrency?.buffer_percentage || 0;
                  const toBuffer = toCurrency?.buffer_percentage || 0;
                  
                  const fromAdjustedRate = applyBuffer(fromRate, fromBuffer);
                  const toAdjustedRate = applyBuffer(toRate, toBuffer);
                  
                  // Convert: amount * (fromRate / toRate)
                  const converted = amount * (fromAdjustedRate / toAdjustedRate);
                  
                  toast.success(`Converted ${amount} ${from} = ${converted.toFixed(2)} ${to} (with buffers applied)`);
                }}
                className="w-full"
              >
                Calculate
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Conversion Formula</h4>
              <p className="text-slate-600">
                Final Amount = Amount × (From Rate × (1 + From Buffer%)) ÷ (To Rate × (1 + To Buffer%))
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Buffer Purpose</h4>
              <p className="text-slate-600">
                Buffers are applied to protect against exchange rate fluctuations and provide margin for currency conversion costs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}