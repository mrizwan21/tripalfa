import { useState, useCallback } from 'react';
import { Globe, Search, Plane, Ticket, Users, ArrowRight, Database, Check, Upload, Download, FileText, Loader2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import { PNRImport } from '@tripalfa/shared-features';

export default function ImportPnrPage() {
  const { addNotification } = useCustomer();

  return (
    <div className="max-w-[1200px] mx-auto pb-20 px-6">
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-light tracking-tight mb-2 text-gray-900">
          Import <span className="font-semibold">PNR</span>
        </h1>
        <p className="text-sm text-gray-500">
          Retrieve PNR from GDS systems or bulk import from CSV
        </p>
      </div>

      <PNRImport
        onImport={(pnr) => {
          addNotification({
            title: 'PNR Imported',
            message: `PNR ${pnr} successfully retrieved from GDS.`,
            type: 'success'
          });
        }}
      />
    </div>
  );
}