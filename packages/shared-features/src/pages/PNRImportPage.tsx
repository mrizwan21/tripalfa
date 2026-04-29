import React, { useState, useCallback } from 'react';
import { Layout } from '../components/Layout';
import {
  Upload, FileText, CheckCircle2, AlertTriangle, Download, X, Loader2,
  Globe, Search, Plane, Ticket, Users, ArrowRight, Database, Check, Plus
} from 'lucide-react';
import { cn, apiManager, TravellerSelectionModal } from '../index';
import type { TravellerProfile } from '../types';

type PNRMode = 'gds' | 'bulk-csv';

type GDSProvider = 'Sabre' | 'Amadeus' | 'Travelport' | 'Galileo';

interface PNRFlightSegment {
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  class: string;
  status: string;
}

interface PNRPassenger {
  title: string;
  firstName: string;
  lastName: string;
  type: 'Adult' | 'Child' | 'Infant';
}

interface RetrievedPNR {
  pnrNumber: string;
  provider: GDSProvider;
  status: string;
  fare: number;
  currency: string;
  segments: PNRFlightSegment[];
  passengers: PNRPassenger[];
}

export default function PNRImportPage() {
  // Mode toggle
  const [mode, setMode] = useState<PNRMode>('gds');

  // GDS Retrieval state
  const [gdsProvider, setGdsProvider] = useState<GDSProvider>('Sabre');
  const [pnrNumber, setPnrNumber] = useState('');
  const [lastName, setLastName] = useState('');
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [retrievedPNR, setRetrievedPNR] = useState<RetrievedPNR | null>(null);
  const [retrieveError, setRetrieveError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // CSV Bulk Import state
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [isTravellerModalOpen, setIsTravellerModalOpen] = useState(false);

  const handleAddTraveller = (traveller: TravellerProfile) => {
    if (!retrievedPNR) return;
    setRetrievedPNR({
      ...retrievedPNR,
      passengers: [
        ...retrievedPNR.passengers,
        {
          title: traveller.title,
          firstName: traveller.firstName,
          lastName: traveller.lastName,
          type: traveller.type
        }
      ]
    });
    setIsTravellerModalOpen(false);
  };

  const GDS_OPTIONS: { value: GDSProvider; label: string }[] = [
    { value: 'Sabre', label: 'Sabre' },
    { value: 'Amadeus', label: 'Amadeus' },
    { value: 'Travelport', label: 'Travelport' },
    { value: 'Galileo', label: 'Galileo' },
  ];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        alert('Please upload a CSV file');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    setImportResult(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setImportResult({
        success: true,
        imported: 15,
        failed: 2,
        errors: [
          'Row 3: Missing passenger name',
          'Row 7: Invalid PNR format'
        ]
      });
    } catch (error) {
      setImportResult({
        success: false,
        imported: 0,
        failed: 0,
        errors: ['Import failed: Network error']
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'PNR,Airline Code,Passenger Name,Route,Travel Date,Status,Amount,Currency,Booking Ref,Ticket Number,Remarks\nABC123,EK,John Doe,DXB-LHR,2026-05-15,Confirmed,1500.00,USD,BKG-001,176-1234567890,Group booking';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pnr_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRetrievePNR = async () => {
    if (!pnrNumber || !lastName) {
      setRetrieveError('Please enter PNR number and passenger last name');
      return;
    }
    setIsRetrieving(true);
    setRetrieveError(null);
    try {
      const result = await apiManager.retrievePNRFromGDS(gdsProvider, pnrNumber, lastName);
      if (result && result.success) {
        setRetrievedPNR({
          pnrNumber: pnrNumber.toUpperCase(),
          provider: gdsProvider,
          status: result.data?.status || 'Confirmed',
          fare: result.data?.fare || 0,
          currency: result.data?.currency || 'BHD',
          segments: result.data?.segments || [],
          passengers: result.data?.passengers || []
        });
      } else {
        throw new Error(result?.message || 'Failed to retrieve PNR');
      }
    } catch (error: any) {
      setRetrieveError(error.message || 'Failed to retrieve PNR. Please check the details and try again.');
    } finally {
      setIsRetrieving(false);
    }
  };

  const handleImportToBooking = async () => {
    if (!retrievedPNR) return;
    setIsImporting(true);
    setRetrieveError(null);
    try {
      const result = await apiManager.importPNRToBooking(retrievedPNR.pnrNumber, retrievedPNR.provider);
      if (result && result.success) {
        setImportSuccess(true);
      } else {
        throw new Error(result?.message || 'Import failed');
      }
    } catch (error: any) {
      setRetrieveError(error.message || 'Import to booking failed. System branch sync error.');
    } finally {
      setIsImporting(false);
    }
  };

  const clearRetrieval = () => {
    setRetrievedPNR(null);
    setPnrNumber('');
    setLastName('');
    setImportSuccess(false);
  };

  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto pb-20 px-6">
        {/* Header */}
        <div className="mb-8 border-b border-navy/10 pb-6">
          <h1 className="text-4xl font-light tracking-tight mb-2 text-pure-black">
            Import <span className="font-semibold">PNR</span>
          </h1>
          <p className="text-sm text-pure-black/50">
            Retrieve PNR from GDS systems or bulk import from CSV
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex items-center gap-2 mb-8 bg-light-gray/50 p-2 rounded-xl w-fit border border-navy/5">
          <button
            onClick={() => { setMode('gds'); setRetrieveError(null); setImportSuccess(false); }}
            className={cn(
              'px-8 py-4 text-[11px] font-semibold tracking-tight rounded-xl transition-all duration-300 flex items-center gap-2',
              mode === 'gds' ? 'bg-pure-black text-apple-blue shadow-sm' : 'text-pure-black/30 hover:text-pure-black/60 hover:bg-white'
            )}
          >
            <Globe size={14} /> GDS Retrieval
          </button>
          <button
            onClick={() => { setMode('bulk-csv'); setRetrieveError(null); }}
            className={cn(
              'px-8 py-4 text-[11px] font-semibold tracking-tight rounded-xl transition-all duration-300 flex items-center gap-2',
              mode === 'bulk-csv' ? 'bg-pure-black text-apple-blue shadow-sm' : 'text-pure-black/30 hover:text-pure-black/60 hover:bg-white'
            )}
          >
            <Database size={14} /> Bulk CSV Import
          </button>
        </div>

        {mode === 'gds' && (
          <div className="space-y-8">
            {/* GDS Retrieval Form */}
            <div className="bg-white rounded-xl border border-navy/5 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-navy/5 flex items-center gap-3">
                <div className="w-10 h-10 bg-apple-blue/10 rounded-xl flex items-center justify-center text-apple-blue">
                  <Search size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-pure-black tracking-tight">GDS PNR Retrieval</h2>
                  <p className="text-xs text-pure-black/40 mt-0.5">Retrieve a Passenger Name Record directly from your GDS provider</p>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* GDS Provider */}
                  <div>
                    <label className="block text-[10px] font-semibold text-pure-black/40 uppercase tracking-wider mb-2">GDS Provider</label>
                    <div className="relative">
                      <select
                        value={gdsProvider}
                        onChange={e => setGdsProvider(e.target.value as GDSProvider)}
                        className="w-full px-4 py-3 bg-white border border-navy/10 rounded-xl text-[11px] text-pure-black outline-none focus:border-apple-blue transition-colors appearance-none cursor-pointer"
                      >
                        {GDS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-pure-black/20">
                        <ArrowRight size={12} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  {/* PNR Number */}
                  <div>
                    <label className="block text-[10px] font-semibold text-pure-black/40 uppercase tracking-wider mb-2">PNR Number</label>
                    <div className="relative">
                      <Ticket size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-pure-black/20" />
                      <input
                        type="text"
                        value={pnrNumber}
                        onChange={e => setPnrNumber(e.target.value.toUpperCase().slice(0, 6))}
                        placeholder="6-character code (e.g. ABC123)"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-navy/10 rounded-xl text-[11px] text-pure-black outline-none focus:border-apple-blue transition-colors font-mono uppercase"
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-[10px] font-semibold text-pure-black/40 uppercase tracking-wider mb-2">Passenger Last Name</label>
                    <div className="relative">
                      <Users size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-pure-black/20" />
                      <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="e.g. Smith"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-navy/10 rounded-xl text-[11px] text-pure-black outline-none focus:border-apple-blue transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {retrieveError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl mb-6 flex items-center gap-3">
                    <AlertTriangle size={16} className="text-red-600 shrink-0" />
                    <p className="text-xs text-red-700 font-medium">{retrieveError}</p>
                  </div>
                )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleRetrievePNR}
                      disabled={isRetrieving}
                      className={cn(
                        "px-8 py-4 rounded-xl text-xs font-bold tracking-tight transition-all flex items-center justify-center gap-2",
                        isRetrieving
                          ? "bg-light-gray text-pure-black/30 cursor-not-allowed"
                          : "bg-pure-black text-apple-blue hover:bg-black shadow-sm"
                      )}
                    >
                      {isRetrieving ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Retrieving PNR...
                        </>
                      ) : (
                        <>
                          <Search size={14} />
                          Retrieve PNR
                        </>
                      )}
                    </button>
                    <button
                      onClick={clearRetrieval}
                      className="px-6 py-4 bg-light-gray text-pure-black/60 text-xs font-semibold rounded-xl hover:bg-black/5 transition-all"
                    >
                      Reset
                    </button>
                  </div>
              </div>
            </div>

            {/* Retrieved PNR Details */}
            {retrievedPNR && (
              <div className="bg-white rounded-xl border border-navy/5 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-navy/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                      <Plane size={18} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-pure-black tracking-tight">Retrieved PNR: {retrievedPNR.pnrNumber}</h2>
                      <p className="text-xs text-pure-black/40 mt-0.5">{retrievedPNR.provider} · {retrievedPNR.segments.length} segment{retrievedPNR.segments.length !== 1 ? 's' : ''} · {retrievedPNR.passengers.length} passenger{retrievedPNR.passengers.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      'px-3 py-1.5 rounded-full text-[9px] font-semibold border',
                      retrievedPNR.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    )}>
                      {retrievedPNR.status}
                    </span>
                    <button 
                      onClick={clearRetrieval}
                      className="p-2 text-pure-black/20 hover:text-red-500 transition-colors"
                      title="Clear retrieval"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {/* Flight Segments */}
                  <div>
                    <h3 className="text-[11px] font-semibold text-pure-black/40 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Plane size={14} className="text-apple-blue" /> Flight Segments
                    </h3>
                    <div className="space-y-3">
                      {retrievedPNR.segments.map((seg, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-light-gray rounded-xl">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[10px] font-bold text-pure-black/30 border border-navy/5">
                            {idx + 1}
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-[9px] text-pure-black/30 font-semibold">Airline</p>
                              <p className="text-[12px] font-semibold text-pure-black">{seg.airline} <span className="font-mono text-pure-black/50">{seg.flightNumber}</span></p>
                            </div>
                            <div>
                              <p className="text-[9px] text-pure-black/30 font-semibold">Route</p>
                              <p className="text-[12px] font-semibold text-pure-black font-mono">{seg.from} → {seg.to}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-pure-black/30 font-semibold">Departure</p>
                              <p className="text-[12px] font-semibold text-pure-black">{new Date(seg.departure).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-pure-black/30 font-semibold">Class</p>
                              <p className="text-[12px] font-semibold text-pure-black">{seg.class}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Passengers */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[11px] font-semibold text-pure-black/40 uppercase tracking-wider flex items-center gap-2">
                        <Users size={14} className="text-apple-blue" /> Passengers
                      </h3>
                      <button 
                        onClick={() => setIsTravellerModalOpen(true)}
                        className="px-4 py-2 bg-black text-apple-blue rounded-xl text-[10px] font-semibold flex items-center gap-2"
                      >
                        <Plus size={12} /> Direct Add Pax
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {retrievedPNR.passengers.map((pax, idx) => (
                        <div key={idx} className="px-5 py-3 bg-light-gray rounded-xl flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[10px] font-bold text-pure-black/30 border border-navy/5">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold text-pure-black">{pax.title} {pax.firstName} {pax.lastName}</p>
                            <p className="text-[9px] text-pure-black/30">{pax.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fare & Import */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4 border-t border-navy/5">
                    <div>
                      <p className="text-[9px] text-pure-black/30 font-semibold">Total Fare</p>
                      <p className="text-2xl font-semibold text-pure-black tabular-nums">{retrievedPNR.currency} {retrievedPNR.fare.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {importSuccess && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <Check size={14} className="text-emerald-600" />
                          <span className="text-[11px] font-semibold text-emerald-700">Imported successfully</span>
                        </div>
                      )}
                      <button
                        onClick={handleImportToBooking}
                        disabled={isImporting || importSuccess}
                        className={cn(
                          "px-8 py-4 rounded-xl text-xs font-bold tracking-tight transition-all flex items-center gap-2",
                          isImporting || importSuccess
                            ? "bg-light-gray text-pure-black/30 cursor-not-allowed"
                            : "bg-apple-blue text-white hover:bg-blue-600 shadow-sm"
                        )}
                      >
                        {isImporting ? (
                          <><Loader2 size={14} className="animate-spin" /> Importing...</>
                        ) : (
                          <><ArrowRight size={14} /> Import to Booking</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'bulk-csv' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload Section */}
              <div className="bg-white rounded-xl border border-navy/5 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-navy/5">
                  <h2 className="text-base font-bold text-pure-black tracking-tight">Upload PNR File</h2>
                  <p className="text-xs text-pure-black/40 mt-1">CSV format only, max 10MB</p>
                </div>

                <div className="p-8">
                  {/* Drop Zone */}
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-xl p-12 text-center transition-all",
                      dragActive ? "border-apple-blue bg-apple-blue/5" : "border-navy/10 hover:border-navy/20",
                      file && "border-emerald-500 bg-apple-blue/10"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {file ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle2 size={48} className="text-apple-blue mb-4" />
                        <p className="text-sm font-semibold text-pure-black mb-1">{file.name}</p>
                        <p className="text-xs text-pure-black/40">{(file.size / 1024).toFixed(2)} KB</p>
                        <button
                          onClick={() => setFile(null)}
                          className="mt-4 text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                        >
                          <X size={12} /> Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload size={48} className="text-pure-black/20 mb-4" />
                        <p className="text-sm font-semibold text-pure-black mb-2">
                          Drag & drop your CSV file here
                        </p>
                        <p className="text-xs text-pure-black/40 mb-4">or</p>
                        <label className="px-6 py-2.5 bg-apple-blue text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-blue-600 transition-all">
                          Browse Files
                          <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Download Template */}
                  <div className="mt-6 flex items-center justify-between p-4 bg-light-gray rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-pure-black/40" />
                      <div>
                        <p className="text-xs font-semibold text-pure-black">CSV Template</p>
                        <p className="text-[10px] text-pure-black/40">Download the import template</p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadTemplate}
                      className="px-4 py-2 bg-black text-white text-[10px] font-bold rounded-lg hover:bg-navy/90 transition-all flex items-center gap-2"
                    >
                      <Download size={12} /> Download
                    </button>
                  </div>

                  {/* Import Button */}
                  <button
                    onClick={handleImport}
                    disabled={!file || isUploading}
                    className={cn(
                      "w-full mt-6 py-3 rounded-xl text-xs font-bold tracking-tight transition-all flex items-center justify-center gap-2",
                      file && !isUploading
                        ? "bg-apple-blue text-white hover:bg-blue-600"
                        : "bg-light-gray text-pure-black/30 cursor-not-allowed"
                    )}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Importing PNR Records...
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        Import PNR
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Results Section */}
              <div className="bg-white rounded-xl border border-navy/5 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-navy/5">
                  <h2 className="text-base font-bold text-pure-black tracking-tight">Import Results</h2>
                </div>

                <div className="p-8">
                  {!importResult && !isUploading && (
                    <div className="text-center py-12">
                      <FileText size={48} className="text-pure-black/10 mx-auto mb-4" />
                      <p className="text-sm text-pure-black/40">No imports yet</p>
                      <p className="text-xs text-pure-black/30 mt-1">Upload a CSV file to see results</p>
                    </div>
                  )}

                  {isUploading && (
                    <div className="text-center py-12">
                      <Loader2 size={48} className="text-apple-blue mx-auto mb-4 animate-spin" />
                      <p className="text-sm font-semibold text-pure-black">Processing Import...</p>
                      <p className="text-xs text-pure-black/40 mt-1">Validating and importing records</p>
                    </div>
                  )}

                  {importResult && (
                    <div className="space-y-6">
                      {/* Summary */}
                      <div className={cn(
                        "p-6 rounded-xl",
                        importResult.success ? "bg-apple-blue/10 border border-apple-blue/20" : "bg-red-50 border border-red-100"
                      )}>
                        <div className="flex items-center gap-3 mb-4">
                          {importResult.success ? (
                            <CheckCircle2 size={24} className="text-apple-blue" />
                          ) : (
                            <AlertTriangle size={24} className="text-red-600" />
                          )}
                          <h3 className="text-sm font-bold text-pure-black">
                            {importResult.success ? "Import Completed" : "Import Failed"}
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-xl">
                            <p className="text-[10px] font-bold text-pure-black/40 tracking-tight mb-1">Imported</p>
                            <p className="text-2xl font-light text-apple-blue">{importResult.imported}</p>
                          </div>
                          <div className="bg-white p-4 rounded-xl">
                            <p className="text-[10px] font-bold text-pure-black/40 tracking-tight mb-1">Failed</p>
                            <p className="text-2xl font-light text-red-600">{importResult.failed}</p>
                          </div>
                        </div>
                      </div>

                      {/* Errors */}
                      {importResult.errors.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-pure-black tracking-tight mb-3">Errors</h4>
                          <div className="space-y-2">
                            {importResult.errors.map((error, idx) => (
                              <div key={idx} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                <p className="text-xs text-red-700">{error}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Success Message */}
                      {importResult.success && importResult.imported > 0 && (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                          <p className="text-xs text-blue-700">
                            ✅ {importResult.imported} PNR records successfully imported and created as bookings.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CSV Format Guide */}
            <div className="bg-white rounded-xl border border-navy/5 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-navy/5">
                <h2 className="text-base font-bold text-pure-black tracking-tight">CSV Format Guide</h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-light-gray">
                      <tr>
                        <th className="text-left py-3 px-4 font-bold text-pure-black/50 tracking-tight">Column</th>
                        <th className="text-left py-3 px-4 font-bold text-pure-black/50 tracking-tight">Description</th>
                        <th className="text-left py-3 px-4 font-bold text-pure-black/50 tracking-tight">Required</th>
                        <th className="text-left py-3 px-4 font-bold text-pure-black/50 tracking-tight">Example</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy/5">
                      <tr>
                        <td className="py-3 px-4 font-semibold">PNR</td>
                        <td className="py-3 px-4 text-pure-black/60">Passenger Name Record</td>
                        <td className="py-3 px-4"><span className="text-red-600 font-bold">Yes</span></td>
                        <td className="py-3 px-4 font-mono">ABC123</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold">Airline Code</td>
                        <td className="py-3 px-4 text-pure-black/60">2-letter airline code</td>
                        <td className="py-3 px-4"><span className="text-red-600 font-bold">Yes</span></td>
                        <td className="py-3 px-4 font-mono">EK</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold">Passenger Name</td>
                        <td className="py-3 px-4 text-pure-black/60">Full passenger name</td>
                        <td className="py-3 px-4"><span className="text-red-600 font-bold">Yes</span></td>
                        <td className="py-3 px-4">John Doe</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold">Route</td>
                        <td className="py-3 px-4 text-pure-black/60">Origin-Destination</td>
                        <td className="py-3 px-4"><span className="text-red-600 font-bold">Yes</span></td>
                        <td className="py-3 px-4 font-mono">DXB-LHR</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold">Travel Date</td>
                        <td className="py-3 px-4 text-pure-black/60">Date of travel (YYYY-MM-DD)</td>
                        <td className="py-3 px-4"><span className="text-red-600 font-bold">Yes</span></td>
                        <td className="py-3 px-4 font-mono">2026-05-15</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold">Status</td>
                        <td className="py-3 px-4 text-pure-black/60">Booking status</td>
                        <td className="py-3 px-4">No</td>
                        <td className="py-3 px-4 font-mono">Confirmed</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold">Amount</td>
                        <td className="py-3 px-4 text-pure-black/60">Booking amount</td>
                        <td className="py-3 px-4"><span className="text-red-600 font-bold">Yes</span></td>
                        <td className="py-3 px-4 font-mono">1500.00</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold">Currency</td>
                        <td className="py-3 px-4 text-pure-black/60">Currency code</td>
                        <td className="py-3 px-4">No</td>
                        <td className="py-3 px-4 font-mono">USD</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <TravellerSelectionModal 
        isOpen={isTravellerModalOpen}
        onClose={() => setIsTravellerModalOpen(false)}
        onSelect={handleAddTraveller}
      />
    </Layout>
  );
}
