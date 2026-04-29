import { useState, useEffect, useCallback } from 'react';
import { ProfileLayout } from './ProfilePage';
import {
  Search, UserPlus, FileEdit, Trash2, Globe, X, Loader2, User, CreditCard, ShieldCheck,
  Fingerprint, Building2, UserCircle, FileText, Users, ChevronDown, ChevronUp,
  Upload, Download, AlertTriangle, CheckCircle2,
  Heart, MessageSquare, Star, Package, RefreshCcw, Clock, Plane, Hotel
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiManager, cn, PageHeader, StatusAlert, SkeletonCard } from '../index';
import type { TravellerProfile, ClientVisa, ClientDependent, ClientPreferences, ClientDocument, ClientPersonalCard } from '../types';

const NATIONALITIES = [
  'Bahrain', 'Saudi Arabia', 'UAE', 'Kuwait', 'Qatar', 'Oman',
  'United Kingdom', 'United States', 'India', 'Pakistan',
  'Germany', 'France', 'Italy', 'Spain', 'Australia', 'Canada'
];

const VISA_TYPES = ['Tourist', 'Business', 'Transit', 'Work', 'Student', 'Residence'];
const CARD_TYPES = ['Visa', 'MasterCard', 'Amex', 'Discover', 'UnionPay'];
const GENDERS = ['Male', 'Female', 'Other'];

interface VisaItem {
  id: string;
  visaNumber: string;
  country: string;
  type: string;
  dateOfIssue: string;
  dateOfExpiry: string;
}

interface DependentItem {
  id: string;
  name: string;
  relation: string;
  dob: string;
  gender: string;
  passportNumber: string;
}

interface DocumentItem {
  id: string;
  title: string;
  fileName: string;
}

interface CardItem {
  id: string;
  cardName: string;
  cardType: string;
  cardNumber: string;
  expiryDate: string;
}

interface Traveller extends TravellerProfile {
  bookings?: number;
  createdAt?: string;
  preferences?: ClientPreferences;
  visaDetails?: string;
  visas?: VisaItem[];
  dependents?: DependentItem[];
  documents?: DocumentItem[];
  cards?: CardItem[];
}

interface FormData {
  profileType: 'Individual' | 'Corporate' | 'Sub-Agent';
  firstName: string;
  lastName: string;
  companyName: string;
  taxId: string;
  title: string;
  dob: string;
  nationality: string;
  passportNumber: string;
  issuingCountry: string;
  passportExpiry: string;
  type: 'Adult' | 'Child' | 'Infant';
  frequentFlyer: string;
  email: string;
  mobile: string;
  visaDetails: string;
  preferences: ClientPreferences;
  visas: VisaItem[];
  dependents: DependentItem[];
  documents: DocumentItem[];
  cards: CardItem[];
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function maskCardNumber(num: string) {
  if (!num) return '';
  const cleaned = num.replace(/\s/g, '');
  if (cleaned.length <= 4) return cleaned;
  return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
}

interface AccordionSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AccordionSection({ title, icon: Icon, children, defaultOpen = false }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="pt-8 border-t border-black/5 space-y-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between group"
        aria-expanded={open}
        aria-label={`Toggle ${title} section`}
      >
        <h4 className="text-[15px] font-display font-bold text-pure-black flex items-center gap-3">
          <Icon size={18} className="text-apple-blue" />
          {title}
        </h4>
        {open ? <ChevronUp size={16} className="text-black/40" /> : <ChevronDown size={16} className="text-black/40" />}
      </button>
      {open && <div className="animate-fade space-y-6">{children}</div>}
    </div>
  );
}

export default function TravellerProfilePage() {
  const [travellers, setTravellers] = useState<Traveller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTraveller, setEditingTraveller] = useState<Traveller | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsedRecords, setParsedRecords] = useState<any[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [isImportingBulk, setIsImportingBulk] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    profileType: 'Individual',
    firstName: '',
    lastName: '',
    companyName: '',
    taxId: '',
    title: 'Mr',
    dob: '',
    nationality: '',
    passportNumber: '',
    issuingCountry: '',
    passportExpiry: '',
    type: 'Adult',
    frequentFlyer: '',
    email: '',
    mobile: '',
    visaDetails: '',
    preferences: { flight: { meal: '', seat: '', frequentFlyer: '', class: undefined, baggage: undefined, wheelchair: undefined }, hotel: { room: '', floor: undefined, view: '', smoking: undefined, breakfast: undefined, earlyCheckIn: undefined, transfer: undefined }, car: { transmission: undefined, type: '', gps: undefined, insurance: undefined } },
    visas: [],
    dependents: [],
    documents: [],
    cards: []
  });

  const [newVisa, setNewVisa] = useState({ visaNumber: '', country: '', type: '', dateOfIssue: '', dateOfExpiry: '' });
  const [newDependent, setNewDependent] = useState({ name: '', relation: '', dob: '', gender: '', passportNumber: '' });
  const [newDocument, setNewDocument] = useState({ title: '', fileName: '' });
  const [newCard, setNewCard] = useState({ cardName: '', cardType: 'Visa', cardNumber: '', expiryDate: '' });

  // Fetch client data when editing
  const { data: clientVisasData } = useQuery({
    queryKey: ['client-visas', editingTraveller?.id],
    queryFn: () => editingTraveller ? apiManager.getClientVisas(editingTraveller.id) : Promise.resolve({ success: false, data: [] }),
    enabled: !!editingTraveller,
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  const { data: clientDependentsData } = useQuery({
    queryKey: ['client-dependents', editingTraveller?.id],
    queryFn: () => editingTraveller ? apiManager.getClientDependents(editingTraveller.id) : Promise.resolve({ success: false, data: [] }),
    enabled: !!editingTraveller,
    staleTime: 5 * 60 * 1000
  });

  const { data: clientPreferencesData } = useQuery({
    queryKey: ['client-preferences', editingTraveller?.id],
    queryFn: () => editingTraveller ? apiManager.getClientPreferences(editingTraveller.id) : Promise.resolve({ 
      success: false, 
      data: { 
        flight: { meal: '', seat: '', frequentFlyer: '', class: undefined, baggage: undefined, wheelchair: undefined }, 
        hotel: { room: '', floor: undefined, view: '', smoking: undefined, breakfast: undefined, earlyCheckIn: undefined, transfer: undefined }, 
        car: { transmission: undefined, type: '', gps: undefined, insurance: undefined } 
      } 
    }),
    enabled: !!editingTraveller,
    staleTime: 5 * 60 * 1000
  });

  const { data: clientDocumentsData } = useQuery({
    queryKey: ['client-documents', editingTraveller?.id],
    queryFn: () => editingTraveller ? apiManager.getClientDocuments(editingTraveller.id) : Promise.resolve({ success: false, data: [] }),
    enabled: !!editingTraveller,
    staleTime: 5 * 60 * 1000
  });

  const { data: clientCardsData } = useQuery({
    queryKey: ['client-cards', editingTraveller?.id],
    queryFn: () => editingTraveller ? apiManager.getClientCards(editingTraveller.id) : Promise.resolve({ success: false, data: [] }),
    enabled: !!editingTraveller,
    staleTime: 5 * 60 * 1000
  });

  const loadTravellers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiManager.getTravellers();
      const mapped = (data as any[]).map(t => ({
        ...t,
        profileType: t.profileType || 'Individual'
      }));
      setTravellers(mapped);
    } catch {
      setTravellers([
        {
          id: 'TRAV-1002',
          tenantId: 'hub-001',
          firstName: 'Mohamed',
          lastName: 'Rizwan',
          title: 'Mr',
          dob: '1990-05-15',
          nationality: 'Bahrain',
          passportNumber: 'L1234567',
          issuingCountry: 'Bahrain',
          passportExpiry: '2030-05-15',
          type: 'Adult',
          bookings: 12,
          profileType: 'Individual',
          email: 'mohamed.rizwan@example.com',
          mobile: '+973 3333 4444',
          preferences: { flight: { meal: 'Halal', seat: 'Window', frequentFlyer: '', class: undefined, baggage: undefined, wheelchair: undefined }, hotel: { room: 'High Floor', floor: undefined, view: '', smoking: undefined, breakfast: undefined, earlyCheckIn: undefined, transfer: undefined }, car: { transmission: undefined, type: '', gps: undefined, insurance: undefined } } as ClientPreferences,
          visas: [
            { id: genId(), visaNumber: 'V-884422', country: 'United States', type: 'B1/B2', dateOfIssue: '2023-01-10', dateOfExpiry: '2033-01-10' },
            { id: genId(), visaNumber: 'V-112233', country: 'United Kingdom', type: 'Tourist', dateOfIssue: '2022-06-15', dateOfExpiry: '2027-06-15' }
          ],
          dependents: [
            { id: genId(), name: 'Ayesha Rizwan', relation: 'Spouse', dob: '1992-08-20', gender: 'Female', passportNumber: 'L7654321' },
            { id: genId(), name: 'Omar Rizwan', relation: 'Son', dob: '2015-03-10', gender: 'Male', passportNumber: 'L1112223' }
          ],
          documents: [
            { id: genId(), title: 'Passport Scan', fileName: 'passport_scan.pdf' },
            { id: genId(), title: 'Emirates ID', fileName: 'emirates_id.pdf' }
          ],
          cards: [
            { id: genId(), cardName: 'Corporate Platinum', cardType: 'Visa', cardNumber: '4242424242424242', expiryDate: '2027-12' }
          ]
        },
        {
          id: 'TRAV-1105',
          tenantId: 'hub-001',
          firstName: 'Sarah',
          lastName: 'Williams',
          title: 'Ms',
          dob: '1985-08-22',
          nationality: 'United Kingdom',
          passportNumber: 'A9876543',
          issuingCountry: 'United Kingdom',
          passportExpiry: '2028-08-22',
          type: 'Adult',
          bookings: 5,
          profileType: 'Individual',
          email: 'sarah.w@example.com',
          preferences: { flight: { meal: 'VGML', seat: 'Aisle', frequentFlyer: '', class: undefined, baggage: undefined, wheelchair: undefined }, hotel: { room: 'Quiet Zone', floor: undefined, view: '', smoking: undefined, breakfast: undefined, earlyCheckIn: undefined, transfer: undefined }, car: { transmission: undefined, type: '', gps: undefined, insurance: undefined } } as ClientPreferences,
          visas: [
            { id: genId(), visaNumber: 'V-556677', country: 'UAE', type: 'Residence', dateOfIssue: '2021-09-01', dateOfExpiry: '2026-09-01' }
          ],
          dependents: [],
          documents: [
            { id: genId(), title: 'Travel Insurance', fileName: 'insurance_2024.pdf' }
          ],
          cards: [
            { id: genId(), cardName: 'Personal Debit', cardType: 'MasterCard', cardNumber: '5555555555554444', expiryDate: '2026-08' }
          ]
        },
        {
          id: 'CORP-882',
          tenantId: 'hub-001',
          firstName: 'Admin',
          lastName: 'User',
          title: 'Mr',
          dob: '',
          nationality: '',
          passportNumber: '',
          issuingCountry: '',
          passportExpiry: '',
          companyName: 'Aramco Energy',
          taxId: 'TRN-99812',
          type: 'Adult',
          bookings: 45,
          profileType: 'Corporate',
          email: 'travel@aramco.com',
          visas: [],
          dependents: [],
          documents: [
            { id: genId(), title: 'Trade License', fileName: 'trade_license.pdf' },
            { id: genId(), title: 'VAT Certificate', fileName: 'vat_cert.pdf' }
          ],
          cards: [
            { id: genId(), cardName: 'Company Card', cardType: 'Amex', cardNumber: '378282246310005', expiryDate: '2028-04' }
          ]
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTravellers();
  }, [loadTravellers]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      loadTravellers();
      return;
    }

    setIsLoading(true);
    try {
      const results = await apiManager.searchTravellers(searchQuery);
      setTravellers(results as Traveller[]);
    } catch {
      const query = searchQuery.toLowerCase();
      setTravellers(prev => prev.filter(t =>
        (t.firstName + ' ' + t.lastName).toLowerCase().includes(query) ||
        t.passportNumber?.toLowerCase().includes(query) ||
        t.companyName?.toLowerCase().includes(query) ||
        t.dob?.includes(searchQuery)
      ));
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, loadTravellers]);

  const handleCreateTraveller = async () => {
    if (formData.profileType === 'Individual' && (!formData.firstName || !formData.lastName || !formData.passportNumber)) {
      setError('Please provide first name, last name, and passport number.');
      return;
    }
    if (formData.profileType === 'Corporate' && !formData.companyName) {
      setError('Company name is mandatory for corporate profiles.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (editingTraveller) {
        await apiManager.updateTraveller(editingTraveller.id, formData);
        setSuccess('Profile updated successfully.');
      } else {
        await apiManager.createTraveller(formData);
        setSuccess('New profile created successfully.');
      }
      setShowCreateModal(false);
      resetForm();
      await loadTravellers();
    } catch {
      setError('Failed to save profile data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTraveller = async (travellerId: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;
    try {
      await apiManager.deleteTraveller(travellerId);
      setTravellers(prev => prev.filter(t => t.id !== travellerId));
      setSuccess('Profile retired successfully.');
    } catch {
      setTravellers(prev => prev.filter(t => t.id !== travellerId));
    }
  };

  const resetForm = () => {
    setFormData({
      profileType: 'Individual', firstName: '', lastName: '', companyName: '', taxId: '', title: 'Mr',
      dob: '', nationality: '', passportNumber: '', issuingCountry: '', passportExpiry: '', type: 'Adult',
      frequentFlyer: '', email: '', mobile: '', visaDetails: '',
      preferences: { flight: { meal: '', seat: '', frequentFlyer: '', class: undefined, baggage: undefined, wheelchair: undefined }, hotel: { room: '', floor: undefined, view: '', smoking: undefined, breakfast: undefined, earlyCheckIn: undefined, transfer: undefined }, car: { transmission: undefined, type: '', gps: undefined, insurance: undefined } } as ClientPreferences,
      visas: [], dependents: [], documents: [], cards: []
    });
    setNewVisa({ visaNumber: '', country: '', type: '', dateOfIssue: '', dateOfExpiry: '' });
    setNewDependent({ name: '', relation: '', dob: '', gender: '', passportNumber: '' });
    setNewDocument({ title: '', fileName: '' });
    setNewCard({ cardName: '', cardType: 'Visa', cardNumber: '', expiryDate: '' });
    setEditingTraveller(null);
  };

  const openEditModal = (traveller: Traveller) => {
    setEditingTraveller(traveller);
    // Note: API data will be populated via useQuery hooks
    // The form will be updated when the data arrives
    setFormData({
      profileType: traveller.profileType,
      firstName: traveller.firstName,
      lastName: traveller.lastName,
      companyName: traveller.companyName || '',
      taxId: traveller.taxId || '',
      title: traveller.title,
      dob: traveller.dob,
      nationality: traveller.nationality,
      passportNumber: traveller.passportNumber,
      issuingCountry: traveller.issuingCountry,
      passportExpiry: traveller.passportExpiry,
      type: traveller.type,
      frequentFlyer: traveller.frequentFlyer || '',
      email: traveller.email || '',
      mobile: traveller.mobile || '',
      visaDetails: traveller.visaDetails || '',
      preferences: traveller.preferences || { flight: { meal: '', seat: '', frequentFlyer: '', class: undefined, baggage: undefined, wheelchair: undefined }, hotel: { room: '', floor: undefined, view: '', smoking: undefined, breakfast: undefined, earlyCheckIn: undefined, transfer: undefined }, car: { transmission: undefined, type: '', gps: undefined, insurance: undefined } } as ClientPreferences,
      visas: traveller.visas || [],
      dependents: traveller.dependents || [],
      documents: traveller.documents || [],
      cards: traveller.cards || []
    });
    setShowCreateModal(true);
  };

  // Update form data when API data arrives
  useEffect(() => {
    if (editingTraveller && clientVisasData?.success && clientVisasData.data) {
      const visas = clientVisasData.data as unknown as VisaItem[];
      setFormData(prev => ({
        ...prev,
        visas
      }));
    }
  }, [clientVisasData, editingTraveller]);

  useEffect(() => {
    if (editingTraveller && clientDependentsData?.success && clientDependentsData.data) {
      const dependents = clientDependentsData.data as DependentItem[];
      setFormData(prev => ({
        ...prev,
        dependents
      }));
    }
  }, [clientDependentsData, editingTraveller]);

  useEffect(() => {
    if (editingTraveller && clientPreferencesData?.success && clientPreferencesData.data) {
      const prefs = clientPreferencesData.data as ClientPreferences;
      setFormData(prev => ({
        ...prev,
        preferences: prefs
      }));
    }
  }, [clientPreferencesData, editingTraveller]);

  useEffect(() => {
    if (editingTraveller && clientDocumentsData?.success && clientDocumentsData.data) {
      const documents = clientDocumentsData.data as unknown as DocumentItem[];
      setFormData(prev => ({
        ...prev,
        documents
      }));
    }
  }, [clientDocumentsData, editingTraveller]);

  useEffect(() => {
    if (editingTraveller && clientCardsData?.success && clientCardsData.data) {
      const cards = clientCardsData.data as unknown as CardItem[];
      setFormData(prev => ({
        ...prev,
        cards
      }));
    }
  }, [clientCardsData, editingTraveller]);

  const getInitials = (first: string, last: string) => {
    return `${first?.[0] || '?'}${last?.[0] || '?'}`;
  };

  const addVisa = () => {
    if (!newVisa.visaNumber || !newVisa.country) return;
    setFormData(prev => ({ ...prev, visas: [...prev.visas, { ...newVisa, id: genId() }] }));
    setNewVisa({ visaNumber: '', country: '', type: '', dateOfIssue: '', dateOfExpiry: '' });
  };

  const removeVisa = (index: number) => {
    setFormData(prev => ({ ...prev, visas: prev.visas.filter((_, i) => i !== index) }));
  };

  const addDependent = () => {
    if (!newDependent.name || !newDependent.relation) return;
    setFormData(prev => ({ ...prev, dependents: [...prev.dependents, { ...newDependent, id: genId() }] }));
    setNewDependent({ name: '', relation: '', dob: '', gender: '', passportNumber: '' });
  };

  const removeDependent = (index: number) => {
    setFormData(prev => ({ ...prev, dependents: prev.dependents.filter((_, i) => i !== index) }));
  };

  const addDocument = () => {
    if (!newDocument.title || !newDocument.fileName) return;
    setFormData(prev => ({ ...prev, documents: [...prev.documents, { ...newDocument, id: genId() }] }));
    setNewDocument({ title: '', fileName: '' });
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== index) }));
  };

  const addCard = () => {
    if (!newCard.cardName || !newCard.cardNumber) return;
    setFormData(prev => ({ ...prev, cards: [...prev.cards, { ...newCard, id: genId() }] }));
    setNewCard({ cardName: '', cardType: 'Visa', cardNumber: '', expiryDate: '' });
  };

  const removeCard = (index: number) => {
    setFormData(prev => ({ ...prev, cards: prev.cards.filter((_, i) => i !== index) }));
  };


  // --- Bulk Upload Helpers ---
  const handleBulkDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleBulkDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setBulkFile(droppedFile);
        parseCSVFile(droppedFile);
      } else {
        setBulkErrors(['Please upload a CSV file']);
      }
    }
  }, []);

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setBulkFile(f);
      parseCSVFile(f);
    }
  };

  function parseCSV(text: string): Record<string, string>[] {
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
      rows.push(row);
    }
    return rows;
  }

  function parseCSVFile(file: File) {
    setIsImportingBulk(true);
    setBulkErrors([]);
    setParsedRecords([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      const errors: string[] = [];
      const records = rows.map((row, idx) => {
        const record = {
          title: row.Title || row.title || '',
          firstName: row.FirstName || row.firstName || row['First Name'] || '',
          lastName: row.LastName || row.lastName || row['Last Name'] || '',
          dob: row.DateOfBirth || row.dateOfBirth || row['Date Of Birth'] || row.DOB || '',
          nationality: row.Nationality || row.nationality || '',
          passportNumber: row.PassportNumber || row.passportNumber || row['Passport Number'] || '',
          passportExpiry: row.PassportExpiry || row.passportExpiry || row['Passport Expiry'] || '',
          issuingCountry: row.IssuingCountry || row.issuingCountry || row['Issuing Country'] || '',
          email: row.Email || row.email || '',
          mobile: row.Mobile || row.mobile || '',
          visaNumber: row.VisaNumber || row.visaNumber || row['Visa Number'] || '',
          visaCountry: row.VisaCountry || row.visaCountry || row['Visa Country'] || '',
          visaType: row.VisaType || row.visaType || row['Visa Type'] || '',
          visaIssueDate: row.VisaIssueDate || row.visaIssueDate || row['Visa Issue Date'] || '',
          visaExpiryDate: row.VisaExpiryDate || row.visaExpiryDate || row['Visa Expiry Date'] || '',
        };
        const rowErrors: string[] = [];
        if (!record.firstName) rowErrors.push('FirstName is required');
        if (!record.lastName) rowErrors.push('LastName is required');
        if (!record.passportNumber) rowErrors.push('PassportNumber is required');
        if (record.dob && !/^\d{4}-\d{2}-\d{2}$/.test(record.dob)) rowErrors.push('DateOfBirth must be YYYY-MM-DD');
        if (record.passportExpiry && !/^\d{4}-\d{2}-\d{2}$/.test(record.passportExpiry)) rowErrors.push('PassportExpiry must be YYYY-MM-DD');
        if (record.visaIssueDate && !/^\d{4}-\d{2}-\d{2}$/.test(record.visaIssueDate)) rowErrors.push('VisaIssueDate must be YYYY-MM-DD');
        if (record.visaExpiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(record.visaExpiryDate)) rowErrors.push('VisaExpiryDate must be YYYY-MM-DD');
        if (rowErrors.length) errors.push(`Row ${idx + 2}: ${rowErrors.join('; ')}`);
        return { ...record, _rowIndex: idx + 2, _errors: rowErrors };
      });
      setParsedRecords(records);
      setBulkErrors(errors);
      setIsImportingBulk(false);
    };
    reader.onerror = () => {
      setBulkErrors(['Failed to read file']);
      setIsImportingBulk(false);
    };
    reader.readAsText(file);
  }

  const handleDownloadTemplate = () => {
    const headers = 'Title,FirstName,LastName,DateOfBirth,Nationality,PassportNumber,PassportExpiry,IssuingCountry,Email,Mobile,VisaNumber,VisaCountry,VisaType,VisaIssueDate,VisaExpiryDate';
    const sample = 'Mr,John,Doe,1990-05-15,Bahrain,L1234567,2030-05-15,Bahrain,john@example.com,+973 3333 4444,V-123456,United States,Tourist,2023-01-10,2033-01-10';
    const csvContent = [headers, sample].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'client_bulk_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  function resetBulkUpload() {
    setBulkFile(null);
    setParsedRecords([]);
    setBulkErrors([]);
    setDragActive(false);
  }

  const handleImportValidRecords = () => {
    const valid = parsedRecords.filter(r => (r._errors as string[]).length === 0);
    if (!valid.length) return;
    const newTravellers: Traveller[] = valid.map(r => ({
      id: 'TRAV-' + Math.floor(1000 + Math.random() * 9000),
      tenantId: 'hub-001',
      profileType: 'Individual',
      title: r.title || 'Mr',
      firstName: r.firstName,
      lastName: r.lastName,
      dob: r.dob,
      nationality: r.nationality,
      passportNumber: r.passportNumber,
      passportExpiry: r.passportExpiry,
      issuingCountry: r.issuingCountry,
      email: r.email,
      mobile: r.mobile,
      type: 'Adult',
      visas: r.visaNumber ? [{
        id: genId(),
        visaNumber: r.visaNumber,
        country: r.visaCountry,
        type: r.visaType || 'Tourist',
        dateOfIssue: r.visaIssueDate,
        dateOfExpiry: r.visaExpiryDate
      }] : [],
      dependents: [],
      documents: [],
      cards: [],
      bookings: 0,
      createdAt: new Date().toISOString().split('T')[0],
      preferences: { flight: { meal: '', seat: '', frequentFlyer: '', class: undefined, baggage: undefined, wheelchair: undefined }, hotel: { room: '', floor: undefined, view: '', smoking: undefined, breakfast: undefined, earlyCheckIn: undefined, transfer: undefined }, car: { transmission: undefined, type: '', gps: undefined, insurance: undefined } } as ClientPreferences,
    }));
    setTravellers(prev => [...newTravellers, ...prev]);
    setSuccess(`Imported ${valid.length} client profile${valid.length > 1 ? 's' : ''} successfully.`);
    resetBulkUpload();
    setShowBulkModal(false);
  };

  return (
    <ProfileLayout>
      <div className="animate-fade-in space-y-8 px-6 lg:px-12 pb-24">

        <PageHeader
          icon={Fingerprint}
          title="Client Hub"
          subtitle="Unified management for End-users, Corporates, and Sub-agents."
          actions={
            <>
              <div className="relative group w-full lg:w-72">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search name, company or ID..."
                  className="w-full bg-white border border-black/10 focus:border-apple-blue focus:ring-4 focus:ring-apple-blue/10 rounded-xl pl-10 pr-4 py-2.5 text-[14px] font-text outline-none transition-all shadow-sm"
                  aria-label="Search travellers"
                />
              </div>
              <button
                onClick={() => { resetForm(); setShowCreateModal(true); }}
                className="px-6 py-2.5 bg-pure-black text-white rounded-xl text-[14px] font-text font-medium shadow-sm hover:bg-black/80 transition-colors flex items-center gap-2 whitespace-nowrap"
                aria-label="Create new profile"
              >
                <UserPlus size={18} /> New Profile
              </button>
              <button
                onClick={() => { resetBulkUpload(); setShowBulkModal(true); }}
                className="px-6 py-2.5 bg-white border border-black/10 text-pure-black rounded-xl text-[14px] font-text font-medium shadow-sm hover:bg-light-gray transition-colors flex items-center gap-2 whitespace-nowrap"
                aria-label="Bulk upload client profiles"
              >
                <Upload size={18} /> Bulk Upload
              </button>
            </>
          }
        />

        <StatusAlert success={success} onDismiss={() => setSuccess('')} />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} className="h-[280px]" />
            ))}
          </div>
        ) : travellers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {travellers.map((traveller) => (
              <div key={traveller.id} className="bg-white border border-black/5 rounded-xl overflow-hidden shadow-sm hover:border-black/10 transition-all flex flex-col group hover:shadow-apple border-t-4 border-t-pure-black/5">
                <div className="p-8 pb-4 flex justify-between items-start">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center text-[18px] font-display font-bold shadow-sm border border-black/5",
                      traveller.profileType === 'Corporate' ? "bg-amber-50 text-amber-700" :
                      traveller.profileType === 'Sub-Agent' ? "bg-apple-blue/5 text-apple-blue" : "bg-light-gray text-pure-black"
                    )}>
                      {traveller.profileType === 'Corporate' ? <Building2 size={24} /> :
                        traveller.profileType === 'Sub-Agent' ? <UserCircle size={24} /> :
                        getInitials(traveller.firstName, traveller.lastName)}
                    </div>
                    <div>
                      <h3 className="text-[17px] font-display font-bold text-pure-black truncate leading-tight mb-1.5">
                        {traveller.profileType === 'Corporate' ? traveller.companyName : `${traveller.title} ${traveller.firstName} ${traveller.lastName}`}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[10px] tracking-tight font-text font-bold px-2.5 py-1 rounded-[8px] border',
                          traveller.profileType === 'Individual' ? 'bg-light-gray text-pure-black border-black/10' :
                          traveller.profileType === 'Corporate' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        )}>
                          {traveller.profileType}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-5 flex-1">
                  {traveller.profileType === 'Corporate' ? (
                    <div className="flex items-start gap-4 animate-fade">
                      <div className="w-8 h-8 rounded-full bg-light-gray flex items-center justify-center text-black/40 shrink-0">
                        <Globe size={14} />
                      </div>
                      <div>
                        <p className="text-[11px] font-text text-black/40 mb-0.5">Tax Registration</p>
                        <p className="text-[13px] font-text font-medium text-pure-black">{traveller.taxId || 'N/A'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4 animate-fade">
                      <div className="w-8 h-8 rounded-full bg-light-gray flex items-center justify-center text-black/40 shrink-0">
                        <ShieldCheck size={14} />
                      </div>
                      <div>
                        <p className="text-[11px] font-text text-black/40 mb-0.5">Passport</p>
                        <p className="text-[13px] font-text font-medium text-pure-black tabular-nums">{traveller.passportNumber || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-light-gray flex items-center justify-center text-black/40 shrink-0">
                      <Globe size={14} />
                    </div>
                    <div>
                      <p className="text-[11px] font-text text-black/40 mb-0.5">Contact Email</p>
                      <p className="text-[13px] font-text font-medium text-pure-black">{traveller.email || 'No Email'}</p>
                    </div>
                  </div>

                  {/* Section counts */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {(traveller.visas?.length || 0) > 0 && (
                      <div className="flex items-center gap-2 text-[12px] font-text text-black/60 bg-light-gray/40 rounded-lg px-3 py-2">
                        <Globe size={13} className="text-apple-blue" />
                        <span className="font-medium text-pure-black">{traveller.visas!.length}</span> Visas
                      </div>
                    )}
                    {(traveller.dependents?.length || 0) > 0 && (
                      <div className="flex items-center gap-2 text-[12px] font-text text-black/60 bg-light-gray/40 rounded-lg px-3 py-2">
                        <Users size={13} className="text-apple-blue" />
                        <span className="font-medium text-pure-black">{traveller.dependents!.length}</span> Dependents
                      </div>
                    )}
                    {(traveller.documents?.length || 0) > 0 && (
                      <div className="flex items-center gap-2 text-[12px] font-text text-black/60 bg-light-gray/40 rounded-lg px-3 py-2">
                        <FileText size={13} className="text-apple-blue" />
                        <span className="font-medium text-pure-black">{traveller.documents!.length}</span> Documents
                      </div>
                    )}
                    {(traveller.cards?.length || 0) > 0 && (
                      <div className="flex items-center gap-2 text-[12px] font-text text-black/60 bg-light-gray/40 rounded-lg px-3 py-2">
                        <CreditCard size={13} className="text-apple-blue" />
                        <span className="font-medium text-pure-black">{traveller.cards!.length}</span> Cards
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-8 py-5 bg-light-gray/20 border-t border-black/5 flex justify-between items-center group-hover:bg-light-gray/40 transition-colors">
                  <div className="text-[12px] font-text text-black/50">
                    <span className="font-bold text-pure-black">{traveller.bookings || 0}</span> Transactions
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(traveller)} className="p-2 text-black/40 hover:text-pure-black hover:bg-white rounded-xl transition-all shadow-sm" aria-label={`Edit ${traveller.firstName} ${traveller.lastName}`}>
                      <FileEdit size={16} />
                    </button>
                    <button onClick={() => handleDeleteTraveller(traveller.id)} className="p-2 text-black/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" aria-label={`Delete ${traveller.firstName} ${traveller.lastName}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-white border border-black/5 rounded-xl">
            <div className="w-16 h-16 bg-light-gray rounded-xl flex items-center justify-center mb-6">
              <User size={32} className="text-black/20" />
            </div>
            <h3 className="text-[16px] font-display font-medium text-pure-black mb-2">No bookings found</h3>
            <p className="max-w-sm text-[14px] font-text text-black/50">No client profiles match your search.</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[110] p-6 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-xl p-10 max-w-4xl w-full shadow-apple relative overflow-hidden animate-scale my-8 border-t-[8px] border-pure-black">

            <div className="flex justify-between items-start mb-10 border-b border-black/5 pb-8">
              <div className="space-y-1">
                <h3 className="text-[28px] font-display font-semibold text-pure-black">
                  {editingTraveller ? 'Edit Client Profile' : 'New Client Profile'}
                </h3>
                <p className="text-[14px] font-text text-black/50">Enter accurate client details for faster bookings.</p>
              </div>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="w-12 h-12 flex items-center justify-center rounded-full bg-light-gray hover:bg-black/10 text-black/40 hover:text-pure-black transition-colors" aria-label="Close modal">
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="mb-8 p-5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-4 text-red-600 text-[14px] font-text shadow-sm">
                <ShieldCheck size={20} className="text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-10">
              {/* Profile Type Selector */}
              <div className="space-y-4">
                <label htmlFor="profile-type" className="text-[13px] font-text font-bold text-pure-black tracking-tight ml-1">Profile Matrix Category</label>
                <div className="flex bg-light-gray p-1.5 rounded-xl border border-black/5">
                  {(['Individual', 'Corporate', 'Sub-Agent'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, profileType: type })}
                      className={cn(
                        'flex-1 py-3 rounded-xl text-[13px] font-text font-bold transition-all',
                        formData.profileType === type ? 'bg-white text-pure-black shadow-apple border border-black/5' : 'text-black/40 hover:text-pure-black'
                      )}
                      aria-label={`Select ${type} profile type`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Identity Matrix */}
              <div className="space-y-8">
                {formData.profileType === 'Individual' ? (
                  <div className="flex gap-6 items-start animate-fade">
                    <div className="w-32 space-y-2">
                      <label className="text-[13px] font-text font-semibold text-pure-black ml-1">Title</label>
                      <select
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-5 py-3.5 text-[14px] font-text outline-none appearance-none transition-all shadow-sm"
                        aria-label="Title"
                      >
                        {['Mr', 'Mrs', 'Ms', 'Mstr', 'Miss', 'Dr'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 space-y-2">
                      <label htmlFor="firstName" className="text-[13px] font-text font-semibold text-pure-black ml-1">First Name *</label>
                      <input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-6 py-3.5 text-[14px] font-text outline-none placeholder:text-black/20 transition-all shadow-sm"
                        placeholder="First Name"
                        aria-label="First name"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label htmlFor="lastName" className="text-[13px] font-text font-semibold text-pure-black ml-1">Last Name *</label>
                      <input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-6 py-3.5 text-[14px] font-text outline-none placeholder:text-black/20 transition-all shadow-sm"
                        placeholder="Last Name"
                        aria-label="Last name"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-fade">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[13px] font-text font-semibold text-pure-black ml-1">Company Entity Name *</label>
                        <input
                          type="text"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          className="w-full bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-6 py-3.5 text-[14px] font-text outline-none placeholder:text-black/20 transition-all shadow-sm"
                          placeholder="Legal Business Name"
                          aria-label="Company name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[13px] font-text font-semibold text-pure-black ml-1">Tax / Registration ID</label>
                        <input
                          type="text"
                          value={formData.taxId}
                          onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                          className="w-full bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-6 py-3.5 text-[14px] font-text outline-none placeholder:text-black/20 transition-all shadow-sm"
                          placeholder="VAT / PAN / TRN"
                          aria-label="Tax ID"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-[13px] font-text font-semibold text-pure-black ml-1">Contact Email</label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-6 py-3.5 text-[14px] font-text outline-none transition-all shadow-sm"
                      placeholder="client@example.com"
                      aria-label="Email"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-text font-semibold text-pure-black ml-1">Mobile Number</label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-6 py-3.5 text-[14px] font-text outline-none transition-all shadow-sm"
                      placeholder="+966 5X XXX XXXX"
                      aria-label="Mobile number"
                    />
                  </div>
                </div>

                {formData.profileType === 'Individual' && (
                  <div className="grid grid-cols-2 gap-8 animate-fade">
                    <div className="space-y-2">
                      <label className="text-[13px] font-text font-semibold text-pure-black ml-1">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="w-full bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-6 py-3.5 text-[14px] font-text outline-none transition-all shadow-sm"
                        aria-label="Date of birth"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-text font-semibold text-pure-black ml-1">Classification</label>
                      <div className="flex bg-light-gray p-1 rounded-xl border border-black/5">
                        {(['Adult', 'Child', 'Infant'] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setFormData({ ...formData, type })}
                            className={cn(
                              'flex-1 py-2.5 rounded-[10px] text-[12px] font-text font-bold transition-all',
                              formData.type === type ? 'bg-white text-pure-black shadow-sm border border-black/5' : 'text-black/40 hover:text-pure-black'
                            )}
                            aria-label={`Type ${type}`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Passport Framework (Individual only) */}
              {formData.profileType === 'Individual' && (
                <div className="space-y-8 pt-8 border-t border-black/5 animate-fade">
                  <h4 className="text-[15px] font-display font-bold text-pure-black flex items-center gap-3">
                    <ShieldCheck size={18} className="text-apple-blue" />
                    Identity Documentation
                  </h4>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[13px] font-text font-semibold text-pure-black ml-1">Nationality</label>
                      <select
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        className="w-full bg-light-gray rounded-xl px-6 py-3.5 text-[14px] font-text outline-none appearance-none"
                        aria-label="Nationality"
                      >
                        <option value="">Select Country/Region</option>
                        {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-text font-semibold text-pure-black ml-1">Passport Number *</label>
                      <input
                        type="text"
                        value={formData.passportNumber}
                        onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                        className="w-full bg-light-gray rounded-xl px-6 py-3.5 text-[14px] font-text outline-none"
                        placeholder="Enter passport number"
                        aria-label="Passport number"
                      />
                    </div>
                  </div>



                  <div className="pt-8 border-t border-black/5 space-y-6">
                    <h4 className="text-[15px] font-display font-bold text-pure-black flex items-center gap-3">
                      <Globe size={18} className="text-apple-blue" />
                      Travel Preferences
                    </h4>
                    <div className="space-y-2 mb-6">
                      <label htmlFor="frequentFlyer" className="text-[13px] font-text font-semibold text-pure-black ml-1">Frequent Flyer Numbers</label>
                      <input
                        id="frequentFlyer"
                        type="text"
                        value={formData.frequentFlyer}
                        onChange={(e) => setFormData({ ...formData, frequentFlyer: e.target.value })}
                        className="w-full bg-light-gray rounded-xl px-4 py-3 text-[13px] font-text outline-none focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue transition-all"
                        placeholder="e.g. EK123456, QR789012"
                        aria-label="Frequent flyer numbers"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="mealPref" className="text-[13px] font-text font-semibold text-pure-black ml-1">Meal Pref</label>
                        <select
                          id="mealPref"
                          value={formData.preferences.flight?.meal || ''}
                          onChange={(e) => setFormData({ ...formData, preferences: { ...formData.preferences, flight: { ...formData.preferences.flight, meal: e.target.value } } })}
                          className="w-full bg-light-gray rounded-xl px-4 py-3 text-[13px] font-text outline-none appearance-none focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue transition-all"
                          aria-label="Meal preference"
                        >
                          <option value="">No Preference</option>
                          <option value="Vegetarian">Vegetarian</option>
                          <option value="Non-Vegetarian">Non-Vegetarian</option>
                          <option value="Vegan">Vegan</option>
                          <option value="Gluten-Free">Gluten-Free</option>
                          <option value="Halal">Halal</option>
                          <option value="Kosher">Kosher</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="seatPref" className="text-[13px] font-text font-semibold text-pure-black ml-1">Seat Pref</label>
                        <select
                          id="seatPref"
                          value={formData.preferences.flight?.seat || ''}
                          onChange={(e) => setFormData({ ...formData, preferences: { ...formData.preferences, flight: { ...formData.preferences.flight, seat: e.target.value } } })}
                          className="w-full bg-light-gray rounded-xl px-4 py-3 text-[13px] font-text outline-none appearance-none focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue transition-all"
                          aria-label="Seat preference"
                        >
                          <option value="">No Preference</option>
                          <option value="Window">Window</option>
                          <option value="Aisle">Aisle</option>
                          <option value="Middle">Middle</option>
                          <option value="Extra Legroom">Extra Legroom</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="roomPref" className="text-[13px] font-text font-semibold text-pure-black ml-1">Room Pref</label>
                        <select
                          id="roomPref"
                          value={formData.preferences.hotel?.room || ''}
                          onChange={(e) => setFormData({ ...formData, preferences: { ...formData.preferences, hotel: { ...formData.preferences.hotel, room: e.target.value } } })}
                          className="w-full bg-light-gray rounded-xl px-4 py-3 text-[13px] font-text outline-none appearance-none focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue transition-all"
                          aria-label="Room preference"
                        >
                          <option value="">No Preference</option>
                          <option value="High Floor">High Floor</option>
                          <option value="Low Floor">Low Floor</option>
                          <option value="Quiet Room">Quiet Room</option>
                          <option value="Near Elevator">Near Elevator</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Visa Management */}
              {formData.profileType === 'Individual' && (
                <AccordionSection title="Visa Management" icon={Globe}>
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={newVisa.visaNumber}
                      onChange={(e) => setNewVisa({ ...newVisa, visaNumber: e.target.value })}
                      placeholder="Visa Number"
                      className="bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-4 py-3 text-[13px] font-text outline-none"
                      aria-label="New visa number"
                    />
                    <select
                      value={newVisa.country}
                      onChange={(e) => setNewVisa({ ...newVisa, country: e.target.value })}
                      className="bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-4 py-3 text-[13px] font-text outline-none appearance-none"
                      aria-label="New visa country"
                    >
                      <option value="">Country</option>
                      {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <select
                      value={newVisa.type}
                      onChange={(e) => setNewVisa({ ...newVisa, type: e.target.value })}
                      className="bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-4 py-3 text-[13px] font-text outline-none appearance-none"
                      aria-label="New visa type"
                    >
                      <option value="">Type</option>
                      {VISA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input
                      type="date"
                      value={newVisa.dateOfIssue}
                      onChange={(e) => setNewVisa({ ...newVisa, dateOfIssue: e.target.value })}
                      className="bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-4 py-3 text-[13px] font-text outline-none"
                      aria-label="New visa date of issue"
                    />
                    <input
                      type="date"
                      value={newVisa.dateOfExpiry}
                      onChange={(e) => setNewVisa({ ...newVisa, dateOfExpiry: e.target.value })}
                      className="bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-4 py-3 text-[13px] font-text outline-none"
                      aria-label="New visa date of expiry"
                    />
                    <button
                      onClick={addVisa}
                      className="bg-pure-black text-white rounded-xl px-4 py-3 text-[13px] font-text font-bold hover:bg-black/80 transition-colors"
                      aria-label="Add visa"
                    >
                      Add Visa
                    </button>
                  </div>
                  {formData.visas.length > 0 && (
                    <div className="space-y-3">
                      {formData.visas.map((visa, idx) => (
                        <div key={visa.id} className="flex items-center justify-between bg-light-gray/40 rounded-xl px-5 py-3 border border-black/5">
                          <div className="flex items-center gap-4">
                            <Globe size={16} className="text-apple-blue" />
                            <div>
                              <p className="text-[13px] font-text font-semibold text-pure-black">{visa.visaNumber}</p>
                              <p className="text-[11px] font-text text-black/50">{visa.country} • {visa.type} • Exp: {visa.dateOfExpiry}</p>
                            </div>
                          </div>
                          <button onClick={() => removeVisa(idx)} className="p-2 text-black/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" aria-label={`Remove visa ${visa.visaNumber}`}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionSection>
              )}

              {/* Dependents */}
              {formData.profileType === 'Individual' && (
                <AccordionSection title="Dependents" icon={Users}>
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={newDependent.name}
                      onChange={(e) => setNewDependent({ ...newDependent, name: e.target.value })}
                      placeholder="Full Name"
                      className="bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-4 py-3 text-[13px] font-text outline-none"
                      aria-label="New dependent name"
                    />
                    <input
                      type="text"
                      value={newDependent.relation}
                      onChange={(e) => setNewDependent({ ...newDependent, relation: e.target.value })}
                      placeholder="Relation"
                      className="bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-4 py-3 text-[13px] font-text outline-none"
                      aria-label="New dependent relation"
                    />
                    <input
                      type="date"
                      value={newDependent.dob}
                      onChange={(e) => setNewDependent({ ...newDependent, dob: e.target.value })}
                      className="bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-4 py-3 text-[13px] font-text outline-none"
                      aria-label="New dependent date of birth"
                    />
                    <select
                      value={newDependent.gender}
                      onChange={(e) => setNewDependent({ ...newDependent, gender: e.target.value })}
                      className="bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-4 py-3 text-[13px] font-text outline-none appearance-none"
                      aria-label="New dependent gender"
                    >
                      <option value="">Gender</option>
                      {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <input
                      type="text"
                      value={newDependent.passportNumber}
                      onChange={(e) => setNewDependent({ ...newDependent, passportNumber: e.target.value })}
                      placeholder="Passport Number"
                      className="bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-4 py-3 text-[13px] font-text outline-none"
                      aria-label="New dependent passport number"
                    />
                    <button
                      onClick={addDependent}
                      className="bg-pure-black text-white rounded-xl px-4 py-3 text-[13px] font-text font-bold hover:bg-black/80 transition-colors"
                      aria-label="Add dependent"
                    >
                      Add Dependent
                    </button>
                  </div>
                  {formData.dependents.length > 0 && (
                    <div className="space-y-3">
                      {formData.dependents.map((dep, idx) => (
                        <div key={dep.id} className="flex items-center justify-between bg-light-gray/40 rounded-xl px-5 py-3 border border-black/5">
                          <div className="flex items-center gap-4">
                            <Users size={16} className="text-apple-blue" />
                            <div>
                              <p className="text-[13px] font-text font-semibold text-pure-black">{dep.name}</p>
                              <p className="text-[11px] font-text text-black/50">{dep.relation} • {dep.gender} • DOB: {dep.dob} • PP: {dep.passportNumber}</p>
                            </div>
                          </div>
                          <button onClick={() => removeDependent(idx)} className="p-2 text-black/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" aria-label={`Remove dependent ${dep.name}`}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionSection>
              )}

              {/* Documents */}
              <AccordionSection title="Documents" icon={FileText}>
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={newDocument.title}
                    onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                    placeholder="Document Title"
                    className="bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-4 py-3 text-[13px] font-text outline-none"
                    aria-label="New document title"
                  />
                  <input
                    type="text"
                    value={newDocument.fileName}
                    onChange={(e) => setNewDocument({ ...newDocument, fileName: e.target.value })}
                    placeholder="File Name (mock)"
                    className="bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-4 py-3 text-[13px] font-text outline-none"
                    aria-label="New document file name"
                  />
                  <button
                    onClick={addDocument}
                    className="bg-pure-black text-white rounded-xl px-4 py-3 text-[13px] font-text font-bold hover:bg-black/80 transition-colors"
                    aria-label="Add document"
                  >
                    Add Document
                  </button>
                </div>
                {formData.documents.length > 0 && (
                  <div className="space-y-3">
                    {formData.documents.map((doc, idx) => (
                      <div key={doc.id} className="flex items-center justify-between bg-light-gray/40 rounded-xl px-5 py-3 border border-black/5">
                        <div className="flex items-center gap-4">
                          <FileText size={16} className="text-apple-blue" />
                          <div>
                            <p className="text-[13px] font-text font-semibold text-pure-black">{doc.title}</p>
                            <p className="text-[11px] font-text text-black/50">{doc.fileName}</p>
                          </div>
                        </div>
                        <button onClick={() => removeDocument(idx)} className="p-2 text-black/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" aria-label={`Remove document ${doc.title}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionSection>

              {/* Cards */}
              <AccordionSection title="Payment Cards" icon={CreditCard}>
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={newCard.cardName}
                    onChange={(e) => setNewCard({ ...newCard, cardName: e.target.value })}
                    placeholder="Card Name"
                    className="bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-4 py-3 text-[13px] font-text outline-none"
                    aria-label="New card name"
                  />
                  <select
                    value={newCard.cardType}
                    onChange={(e) => setNewCard({ ...newCard, cardType: e.target.value })}
                    className="bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-4 py-3 text-[13px] font-text outline-none appearance-none"
                    aria-label="New card type"
                  >
                    {CARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    type="text"
                    value={newCard.cardNumber}
                    onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
                    placeholder="Card Number"
                    className="bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-4 py-3 text-[13px] font-text outline-none"
                    aria-label="New card number"
                  />
                  <input
                    type="month"
                    value={newCard.expiryDate}
                    onChange={(e) => setNewCard({ ...newCard, expiryDate: e.target.value })}
                    className="bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-4 py-3 text-[13px] font-text outline-none"
                    aria-label="New card expiry date"
                  />
                  <button
                    onClick={addCard}
                    className="bg-pure-black text-white rounded-xl px-4 py-3 text-[13px] font-text font-bold hover:bg-black/80 transition-colors"
                    aria-label="Add payment card"
                  >
                    Add Card
                  </button>
                </div>
                {formData.cards.length > 0 && (
                  <div className="space-y-3">
                    {formData.cards.map((card, idx) => (
                      <div key={card.id} className="flex items-center justify-between bg-light-gray/40 rounded-xl px-5 py-3 border border-black/5">
                        <div className="flex items-center gap-4">
                          <CreditCard size={16} className="text-apple-blue" />
                          <div>
                            <p className="text-[13px] font-text font-semibold text-pure-black">{card.cardName}</p>
                            <p className="text-[11px] font-text text-black/50">{card.cardType} • {maskCardNumber(card.cardNumber)} • Exp: {card.expiryDate}</p>
                          </div>
                        </div>
                        <button onClick={() => removeCard(idx)} className="p-2 text-black/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" aria-label={`Remove card ${card.cardName}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionSection>

              {/* Relationship Management */}
              <AccordionSection title="Relationship Management" icon={Heart}>
                <div className="space-y-6">
                  <div className="p-5 bg-light-gray/40 rounded-xl border border-black/5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-text font-semibold text-black/50">Relationship Score</span>
                      <span className="text-xl font-display font-bold text-apple-blue">85<span className="text-[11px] font-text text-black/30">/100</span></span>
                    </div>
                    <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                      <div className="h-full bg-apple-blue rounded-full transition-all" style={{ width: '85%' }} />
                    </div>
                    <p className="text-[10px] font-text text-black/40 mt-2">Based on booking frequency, tenure, and engagement</p>
                  </div>

                  <div>
                    <h5 className="text-[12px] font-text font-semibold text-pure-black mb-3">Communication Log</h5>
                    <div className="relative pl-6 space-y-4 border-l-2 border-black/10">
                      {[
                        { date: '20 Apr 2026', channel: 'Email', summary: 'Sent booking confirmation for BAH-LHR flight', agent: 'Abid Malik' },
                        { date: '18 Apr 2026', channel: 'Phone', summary: 'Discussed hotel upgrade options for Dubai trip', agent: 'Arunika' },
                        { date: '10 Apr 2026', channel: 'Chat', summary: 'Resolved visa document query', agent: 'Abid Malik' },
                        { date: '28 Mar 2026', channel: 'In-Person', summary: 'Annual account review meeting', agent: 'Rizwan Mohamed' },
                      ].map((entry, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[25px] w-3 h-3 bg-white border-2 border-apple-blue rounded-full" />
                          <div className="bg-white border border-black/5 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-3 mb-1">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-bold border",
                                entry.channel === 'Email' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                entry.channel === 'Phone' ? 'bg-green-50 text-green-600 border-green-200' :
                                entry.channel === 'Chat' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                'bg-amber-50 text-amber-600 border-amber-200'
                              )}>
                                {entry.channel}
                              </span>
                              <span className="text-[10px] text-black/40">{entry.date}</span>
                            </div>
                            <p className="text-[11px] font-text text-pure-black">{entry.summary}</p>
                            <p className="text-[10px] font-text text-black/40 mt-1">by {entry.agent}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AccordionSection>

              {/* Order Tracking */}
              <AccordionSection title="Order Tracking" icon={Package}>
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-black/5">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-pure-black text-white text-[10px] font-semibold tracking-tight">
                          <th className="py-4 px-5">Reference</th>
                          <th className="py-4 px-5">Service</th>
                          <th className="py-4 px-5">Booking Date</th>
                          <th className="py-4 px-5">Travel Date</th>
                          <th className="py-4 px-5">Amount</th>
                          <th className="py-4 px-5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {[
                          { ref: 'BK-2026-0891', service: 'Flight', icon: Plane, bookDate: '20 Apr 2026', travelDate: '15 May 2026', amount: 'BHD 485.500', status: 'Confirmed' },
                          { ref: 'BK-2026-0744', service: 'Hotel', icon: Hotel, bookDate: '10 Mar 2026', travelDate: '25 Mar 2026', amount: 'BHD 320.000', status: 'Completed' },
                          { ref: 'BK-2026-0612', service: 'Flight', icon: Plane, bookDate: '28 Feb 2026', travelDate: '01 Apr 2026', amount: 'BHD 1,250.000', status: 'Ticketed' },
                          { ref: 'BK-2025-1893', service: 'Package', icon: Package, bookDate: '15 Dec 2025', travelDate: '10 Jan 2026', amount: 'BHD 890.000', status: 'Cancelled' },
                        ].map((order, idx) => (
                          <tr key={idx} className="group hover:bg-light-gray/50 transition-all">
                            <td className="py-3 px-5 text-[11px] font-semibold text-apple-blue">{order.ref}</td>
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-2">
                                <order.icon size={14} className="text-pure-black/40" />
                                <span className="text-[11px] font-text text-pure-black">{order.service}</span>
                              </div>
                            </td>
                            <td className="py-3 px-5 text-[11px] text-pure-black/60">{order.bookDate}</td>
                            <td className="py-3 px-5 text-[11px] text-pure-black/60">{order.travelDate}</td>
                            <td className="py-3 px-5 text-[11px] font-semibold text-pure-black">{order.amount}</td>
                            <td className="py-3 px-5">
                              <span className={cn(
                                "px-2.5 py-1 rounded-full text-[9px] font-bold border",
                                order.status === 'Confirmed' ? 'bg-apple-blue/10 text-apple-blue border-apple-blue/20' :
                                order.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-200' :
                                order.status === 'Ticketed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                'bg-red-50 text-red-500 border-red-200'
                              )}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="relative pl-6 space-y-4 border-l-2 border-black/10">
                    <p className="text-[10px] font-bold text-pure-black/40 tracking-tight mb-2">Latest Order Timeline — BK-2026-0891</p>
                    {[
                      { time: '20 Apr, 14:30', event: 'Booking Created', active: false },
                      { time: '20 Apr, 14:32', event: 'Payment Received', active: false },
                      { time: '20 Apr, 15:01', event: 'PNR Confirmed by Airline', active: false },
                      { time: '20 Apr, 15:05', event: 'E-Ticket Issued', active: true },
                    ].map((step, idx) => (
                      <div key={idx} className="relative">
                        <div className={cn(
                          "absolute -left-[25px] w-3 h-3 rounded-full border-2",
                          step.active ? "bg-apple-blue border-apple-blue" : "bg-white border-black/20"
                        )} />
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-black/40 w-28 shrink-0">{step.time}</span>
                          <span className={cn("text-[11px] font-text", step.active ? "font-semibold text-pure-black" : "text-pure-black/60")}>{step.event}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionSection>

              {/* Feedback & Satisfaction */}
              <AccordionSection title="Feedback & Satisfaction" icon={Star}>
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-5 bg-light-gray/40 rounded-xl border border-black/5 text-center">
                      <p className="text-[9px] font-bold text-black/40 tracking-tight mb-2">CSAT Score</p>
                      <p className="text-2xl font-display font-bold text-pure-black">4.2<span className="text-[11px] font-text text-black/30">/5</span></p>
                    </div>
                    <div className="p-5 bg-light-gray/40 rounded-xl border border-black/5 text-center">
                      <p className="text-[9px] font-bold text-black/40 tracking-tight mb-2">NPS</p>
                      <p className="text-2xl font-display font-bold text-apple-blue">+72</p>
                    </div>
                    <div className="p-5 bg-light-gray/40 rounded-xl border border-black/5 text-center">
                      <p className="text-[9px] font-bold text-black/40 tracking-tight mb-2">Total Responses</p>
                      <p className="text-2xl font-display font-bold text-pure-black">8</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-[12px] font-text font-semibold text-pure-black">Recent Feedback</h5>
                    {[
                      { type: 'Post-Booking', rating: 5, comment: 'Excellent service, very quick booking process.', date: '15 Apr 2026' },
                      { type: 'Post-Travel', rating: 4, comment: 'Good overall but hotel check-in was delayed.', date: '20 Mar 2026' },
                      { type: 'General', rating: 5, comment: 'Always reliable for business travel arrangements.', date: '10 Feb 2026' },
                    ].map((fb, idx) => (
                      <div key={idx} className="p-4 bg-white border border-black/5 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-0.5 bg-light-gray text-pure-black/60 rounded-full text-[9px] font-bold border border-black/5">{fb.type}</span>
                          <span className="text-[10px] text-black/40">{fb.date}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12} className={i < fb.rating ? 'text-amber-400 fill-amber-400' : 'text-black/10'} />
                          ))}
                        </div>
                        <p className="text-[11px] font-text text-pure-black/70">{fb.comment}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 p-5 bg-light-gray/30 rounded-xl border border-black/5">
                    <h5 className="text-[12px] font-text font-semibold text-pure-black">Submit Feedback</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <select className="bg-white focus:ring-4 focus:ring-apple-blue/10 border border-black/10 focus:border-apple-blue rounded-xl px-4 py-3 text-[11px] font-text outline-none">
                        <option>Post-Booking</option>
                        <option>Post-Travel</option>
                        <option>General</option>
                      </select>
                      <select className="bg-white focus:ring-4 focus:ring-apple-blue/10 border border-black/10 focus:border-apple-blue rounded-xl px-4 py-3 text-[11px] font-text outline-none">
                        <option>5 — Excellent</option>
                        <option>4 — Good</option>
                        <option>3 — Average</option>
                        <option>2 — Poor</option>
                        <option>1 — Very Poor</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Feedback comments..."
                      rows={3}
                      className="w-full bg-white focus:ring-4 focus:ring-apple-blue/10 border border-black/10 focus:border-apple-blue rounded-xl px-4 py-3 text-[11px] font-text outline-none resize-none"
                    />
                    <button className="px-5 py-2.5 bg-pure-black text-white text-[11px] font-text font-bold rounded-xl hover:bg-black/80 transition-all">
                      Submit Feedback
                    </button>
                  </div>
                </div>
              </AccordionSection>

              {/* CRM Integration */}
              <AccordionSection title="CRM Integration" icon={RefreshCcw}>
                <div className="space-y-4">
                  {[
                    { name: 'Salesforce', status: 'Connected', lastSync: '20 Apr 2026, 10:30', color: 'bg-apple-blue/10 text-apple-blue border-apple-blue/20' },
                    { name: 'HubSpot', status: 'Not Connected', lastSync: '', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                    { name: 'Zoho CRM', status: 'Not Connected', lastSync: '', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                  ].map((crm, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-light-gray/40 rounded-xl border border-black/5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-black/5">
                          <Globe size={18} className="text-black/30" />
                        </div>
                        <div>
                          <p className="text-[12px] font-text font-semibold text-pure-black">{crm.name}</p>
                          <p className="text-[10px] font-text text-black/40">
                            {crm.lastSync ? `Last synced: ${crm.lastSync}` : 'Not yet configured'}
                          </p>
                        </div>
                      </div>
                      <span className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold border", crm.color)}>
                        {crm.status}
                      </span>
                    </div>
                  ))}
                  <p className="text-[10px] font-text text-black/40">Contact your administrator to configure CRM integrations.</p>
                </div>
              </AccordionSection>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-4 pt-8 mt-8 border-t border-black/5">
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="px-8 py-3.5 rounded-xl text-[14px] font-text font-bold text-pure-black hover:bg-light-gray transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTraveller}
                disabled={isSubmitting}
                className="px-10 py-3.5 bg-pure-black text-white rounded-xl text-[14px] font-text font-bold hover:bg-black/80 transition-all flex items-center gap-3 shadow-apple disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/30"
                aria-label={editingTraveller ? 'Save profile changes' : 'Create new profile'}
              >
                {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                {editingTraveller ? 'Save Changes' : 'Create Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProfileLayout>
  );
}

