import React, { useState, useEffect } from 'react';
import { useCurrency, CURRENCY_INFO } from '../lib/currency';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Switch } from '../components/ui/Switch';
import { toast } from '../components/ui/Toast';
import { Save, RefreshCw, Plus, Trash2, Edit, Check, X } from 'lucide-react';

export function CurrencyManagement() {
  const { currency, setCurrency, convert, rates, lastUpdated, isLoading } = useCurrency();
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', symbol: '', decimalDigits: 2 });
  const [newCurrency, setNewCurrency] = useState({ code: '', name: '', symbol: '', decimalDigits: 2 });

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      const result = await api.get('/currencies');
      setCurrencies(result || []);
    } catch (error) {
      console.error('Failed to load currencies:', error);
      toast.error('Failed to load currencies');
    }
  };

  const handleEdit = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (currency) {
      setEditForm({
        name: currency.name,
        symbol: currency.symbol || '',
        decimalDigits: currency.decimal_digits || 2
      });
      setIsEditing(currencyCode);
    }
  };

  const saveEdit = async () => {
    if (!isEditing) return;

    try {
      await api.post('/currencies', {
        code: isEditing,
        name: editForm.name,
        symbol: editForm.symbol,
        decimal_digits: editForm.decimalDigits
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
    setEditForm({ name: '', symbol: '', decimalDigits: 2 });
  };

  const addCurrency = async () => {
    if (!newCurrency.code || !newCurrency.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await api.post('/currencies', newCurrency);
      toast.success('Currency added successfully');
      setNewCurrency({ code: '', name: '', symbol: '', decimalDigits: 2 });
      loadCurrencies();
    } catch (error) {
      console.error('Failed to add currency:', error);
      toast.error('Failed to add currency');
    }
  };

  const deleteCurrency = async (code: string) => {
    if (!confirm('Are you sure you want to delete this currency?')) return;

    try {
      await api.delete(`/currencies/${code}`);
      toast.success('Currency deleted successfully');
      loadCurrencies();
    } catch (error) {
      console.error('Failed to delete currency:', error);
      toast.error('Failed to delete currency');
    }
  };

  const updateExchangeRates = async () => {
    try {
      // Fetch latest rates from external API
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (!response.ok) throw new Error('Failed to fetch exchange rates');

      const data = await response.json();

      // Save to database
      await api.post('/exchange-rates/save', {
        source: 'exchangerate-api.com',
        base_currency: 'USD',
        rates: data.rates
      });

      toast.success('Exchange rates updated successfully');
      // Refresh the currency hook to get new rates
      // This would typically trigger a re-render with updated rates
    } catch (error) {
      console.error('Failed to update exchange rates:', error);
      toast.error('Failed to update exchange rates');
    }
  };

  const toggleCurrencyActive = async (code: string, isActive: boolean) => {
    try {
      await api.patch(`/currencies/${code}/toggle`, { is_active: !isActive });
      toast.success(`Currency ${!isActive ? 'activated' : 'deactivated'} successfully`);
      loadCurrencies();
    } catch (error) {
      console.error('Failed to toggle currency:', error);
      toast.error('Failed to toggle currency');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Currency Management</h1>
        <p className="text-slate-600">Manage currencies and exchange rates for your booking engine</p>
      </div>

      {/* Current Exchange Rates */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Exchange Rates (Base: USD)</span>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}
              </span>
              <Button
                variant="outline"
                onClick={updateExchangeRates}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Update Rates
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(rates || {}).map(([code, rate]) => (
              <div key={code} className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{code}</div>
                    <div className="text-sm text-slate-600">{CURRENCY_INFO[code]?.name || code}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold">{rate}</div>
                    <div className="text-sm text-slate-600">per USD</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Currency List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Available Currencies</span>
            <Button onClick={() => window.location.href = '/admin-translations'} variant="outline">
              Manage Translations
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add New Currency */}
          <div className="mb-6 p-4 border border-slate-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Add New Currency</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencies.map((curr) => (
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
                    <Switch
                      checked={curr.is_active}
                      onCheckedChange={() => toggleCurrencyActive(curr.code, curr.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isEditing === curr.code ? (
                        <>
                          <Button variant="outline" size="sm" onClick={saveEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(curr.code)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteCurrency(curr.code)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Currency Conversion Test */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Currency Conversion Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Amount</Label>
              <Input type="number" placeholder="100" id="testAmount" />
            </div>
            <div>
              <Label>From Currency</Label>
              <select id="fromCurrency" className="w-full p-2 border rounded">
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>To Currency</Label>
              <select id="toCurrency" className="w-full p-2 border rounded">
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => {
              const amount = parseFloat((document.getElementById('testAmount') as HTMLInputElement).value);
              const from = (document.getElementById('fromCurrency') as HTMLSelectElement).value;
              const to = (document.getElementById('toCurrency') as HTMLSelectElement).value;

              if (isNaN(amount)) {
                toast.error('Please enter a valid amount');
                return;
              }

              const converted = convert(amount, from, to);
              toast.success(`Converted ${amount} ${from} = ${converted} ${to}`);
            }}>
              Test Conversion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}