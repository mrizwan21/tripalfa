import { CustomerCosting, SupplierCosting } from '@/features/manual-booking/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Plus, Trash2, Users, Building2 } from 'lucide-react';

interface CustomerCostingTableProps {
  costing: CustomerCosting[];
  onUpdate: (costing: CustomerCosting[]) => void;
  readOnly?: boolean;
}

interface SupplierCostingTableProps {
  costing: SupplierCosting[];
  onUpdate: (costing: SupplierCosting[]) => void;
  readOnly?: boolean;
}

export function CustomerCostingTable({ costing, onUpdate, readOnly = false }: CustomerCostingTableProps) {
  const addRow = () => {
    const newRow: CustomerCosting = {
      pNo: costing.length + 1,
      passengerName: '',
      fareBase: 0,
      taxes: 0,
      markup: 0,
      serviceCharge: 0,
      netCost: 0,
    };
    onUpdate([...costing, newRow]);
  };

  const removeRow = (pNo: number) => {
    const updated = costing
      .filter(c => c.pNo !== pNo)
      .map((c, index) => ({ ...c, pNo: index + 1 }));
    onUpdate(updated);
  };

  const updateRow = (pNo: number, field: keyof CustomerCosting, value: number | string) => {
    const updated = costing.map(c => {
      if (c.pNo !== pNo) return c;
      const updatedRow = { ...c, [field]: value };
      // Recalculate net cost
      updatedRow.netCost = updatedRow.fareBase + updatedRow.taxes + updatedRow.markup + updatedRow.serviceCharge;
      return updatedRow;
    });
    onUpdate(updated);
  };

  const totals = costing.reduce(
    (acc, c) => ({
      fareBase: acc.fareBase + c.fareBase,
      taxes: acc.taxes + c.taxes,
      markup: acc.markup + c.markup,
      serviceCharge: acc.serviceCharge + c.serviceCharge,
      netCost: acc.netCost + c.netCost,
    }),
    { fareBase: 0, taxes: 0, markup: 0, serviceCharge: 0, netCost: 0 }
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Customer Costing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table className="costing-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">P No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-24 text-right">Fare Base</TableHead>
                <TableHead className="w-24 text-right">Taxes</TableHead>
                <TableHead className="w-24 text-right">Markup</TableHead>
                <TableHead className="w-24 text-right">Svc Charge</TableHead>
                <TableHead className="w-24 text-right">Net Cost</TableHead>
                {!readOnly && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {costing.map((row) => (
                <TableRow key={row.pNo}>
                  <TableCell>{row.pNo}</TableCell>
                  <TableCell>
                    {readOnly ? row.passengerName : (
                      <Input
                        value={row.passengerName}
                        onChange={(e) => updateRow(row.pNo, 'passengerName', e.target.value)}
                        placeholder="Name - ADT"
                        className="h-8"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {readOnly ? row.fareBase.toFixed(2) : (
                      <Input
                        type="number"
                        value={row.fareBase}
                        onChange={(e) => updateRow(row.pNo, 'fareBase', parseFloat(e.target.value) || 0)}
                        className="h-8 text-right"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {readOnly ? row.taxes.toFixed(2) : (
                      <Input
                        type="number"
                        value={row.taxes}
                        onChange={(e) => updateRow(row.pNo, 'taxes', parseFloat(e.target.value) || 0)}
                        className="h-8 text-right"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {readOnly ? row.markup.toFixed(2) : (
                      <Input
                        type="number"
                        value={row.markup}
                        onChange={(e) => updateRow(row.pNo, 'markup', parseFloat(e.target.value) || 0)}
                        className="h-8 text-right"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {readOnly ? row.serviceCharge.toFixed(2) : (
                      <Input
                        type="number"
                        value={row.serviceCharge}
                        onChange={(e) => updateRow(row.pNo, 'serviceCharge', parseFloat(e.target.value) || 0)}
                        className="h-8 text-right"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">{row.netCost.toFixed(2)}</TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeRow(row.pNo)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold">{totals.fareBase.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold">{totals.taxes.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold">{totals.markup.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold">{totals.serviceCharge.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold">{totals.netCost.toFixed(2)}</TableCell>
                {!readOnly && <TableCell></TableCell>}
              </TableRow>
            </TableBody>
          </Table>
        </div>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={addRow} className="mt-3">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function SupplierCostingTable({ costing, onUpdate, readOnly = false }: SupplierCostingTableProps) {
  const addRow = () => {
    const newRow: SupplierCosting = {
      pNo: costing.length + 1,
      passengerName: '',
      fareBase: 0,
      taxes: 0,
      commission: 0,
      netCost: 0,
    };
    onUpdate([...costing, newRow]);
  };

  const removeRow = (pNo: number) => {
    const updated = costing
      .filter(c => c.pNo !== pNo)
      .map((c, index) => ({ ...c, pNo: index + 1 }));
    onUpdate(updated);
  };

  const updateRow = (pNo: number, field: keyof SupplierCosting, value: number | string) => {
    const updated = costing.map(c => {
      if (c.pNo !== pNo) return c;
      const updatedRow = { ...c, [field]: value };
      // Recalculate net cost (fare + taxes - commission)
      updatedRow.netCost = updatedRow.fareBase + updatedRow.taxes - updatedRow.commission;
      return updatedRow;
    });
    onUpdate(updated);
  };

  const totals = costing.reduce(
    (acc, c) => ({
      fareBase: acc.fareBase + c.fareBase,
      taxes: acc.taxes + c.taxes,
      commission: acc.commission + c.commission,
      netCost: acc.netCost + c.netCost,
    }),
    { fareBase: 0, taxes: 0, commission: 0, netCost: 0 }
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Supplier Costing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table className="costing-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">P No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-24 text-right">Fare Base</TableHead>
                <TableHead className="w-24 text-right">Taxes</TableHead>
                <TableHead className="w-24 text-right">Commission</TableHead>
                <TableHead className="w-24 text-right">Net Cost</TableHead>
                {!readOnly && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {costing.map((row) => (
                <TableRow key={row.pNo}>
                  <TableCell>{row.pNo}</TableCell>
                  <TableCell>
                    {readOnly ? row.passengerName : (
                      <Input
                        value={row.passengerName}
                        onChange={(e) => updateRow(row.pNo, 'passengerName', e.target.value)}
                        placeholder="Name - ADT"
                        className="h-8"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {readOnly ? row.fareBase.toFixed(2) : (
                      <Input
                        type="number"
                        value={row.fareBase}
                        onChange={(e) => updateRow(row.pNo, 'fareBase', parseFloat(e.target.value) || 0)}
                        className="h-8 text-right"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {readOnly ? row.taxes.toFixed(2) : (
                      <Input
                        type="number"
                        value={row.taxes}
                        onChange={(e) => updateRow(row.pNo, 'taxes', parseFloat(e.target.value) || 0)}
                        className="h-8 text-right"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {readOnly ? row.commission.toFixed(2) : (
                      <Input
                        type="number"
                        value={row.commission}
                        onChange={(e) => updateRow(row.pNo, 'commission', parseFloat(e.target.value) || 0)}
                        className="h-8 text-right"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">{row.netCost.toFixed(2)}</TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeRow(row.pNo)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold">{totals.fareBase.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold">{totals.taxes.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold">{totals.commission.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold">{totals.netCost.toFixed(2)}</TableCell>
                {!readOnly && <TableCell></TableCell>}
              </TableRow>
            </TableBody>
          </Table>
        </div>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={addRow} className="mt-3">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
