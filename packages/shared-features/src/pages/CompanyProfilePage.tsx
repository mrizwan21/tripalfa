import React, { useState, useCallback } from 'react';
import { Building2, FileText, Phone, MapPin, CreditCard, Package, Shield, Upload, AlertTriangle, CheckCircle2, TrendingUp, DollarSign, Save, ArrowRight, ArrowLeft, X, Image } from 'lucide-react';
import { cn } from '../lib/utils';
import { ProfileLayout } from './ProfilePage';
import { apiManager } from '../services/apiManager';
import { NodalPageHeader } from '../index';

const TAB_ITEMS = [
  { id: 'agency', label: 'Agency Info', icon: Building2 },
  { id: 'licensing', label: 'Licensing', icon: FileText },
  { id: 'contacts', label: 'Contacts', icon: Phone },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'banking', label: 'Banking', icon: CreditCard },
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'permissions', label: 'Permissions', icon: Shield },
  { id: 'documents', label: 'Documents', icon: Upload },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp }
];

export default function CompanyProfilePage() {
  const [activeTab, setActiveTab] = useState('agency');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    legalName: 'Saba Travel Agency',
    tradeName: 'Saba Travels',
    registrationNo: 'REG-2020-001',
    dateOfEstablishment: '2020-01-15',
    iataNo: '9876543210',
    officeId: 'BAH1A0001',
    vatNo: 'VAT-BH-12345',
    primaryContactName: 'Ahmed Al-Zahrawi',
    primaryEmail: 'ahmed@sabatravels.com',
    primaryPhone: '+973 1712 3456',
    address1: 'Building 123, Road 45',
    city: 'Manama',
    country: 'Bahrain',
    bankName: 'Ahli United Bank',
    accountNo: '0012345678901',
    paymentType: 'CREDIT',
    creditLimit: 100000,
    accessFlights: true,
    accessHotels: true,
    canManageBranches: true,
    canManageUsers: true,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiManager.updateCompanyProfile('current', formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save company profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileLayout>
      <div className="max-w-[1550px] mx-auto pb-20 px-6 pt-8 animate-fade">
        <NodalPageHeader
          title="Entity"
          highlightedTitle="Profile"
          nodeName="TENANT_CONFIG"
          subtitle="Manage master agency identity, licensing, and algorithmic permissions."
          actions={
            <div className="flex gap-4">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-black/5 text-black/40 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-black/10 transition-all">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl flex items-center gap-3">
                    {saving ? <Save size={16} className="animate-spin" /> : <Save size={16} />}
                    Commit Changes
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="px-8 py-3 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl">Edit Master Profile</button>
              )}
            </div>
          }
        />

        <div className="flex overflow-x-auto gap-4 my-12 no-scrollbar pb-2">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-3",
                activeTab === tab.id ? "bg-black text-apple-blue shadow-lg" : "bg-black/[0.02] text-black/20 hover:text-black/40"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {activeTab === 'agency' && (
              <>
                <FormField label="Legal Identity" value={formData.legalName} onChange={v => setFormData({...formData, legalName: v})} editing={isEditing} />
                <FormField label="Trade Label" value={formData.tradeName} onChange={v => setFormData({...formData, tradeName: v})} editing={isEditing} />
                <FormField label="Registration Index" value={formData.registrationNo} onChange={v => setFormData({...formData, registrationNo: v})} editing={isEditing} />
                <FormField label="Inception Date" type="date" value={formData.dateOfEstablishment} onChange={v => setFormData({...formData, dateOfEstablishment: v})} editing={isEditing} />
              </>
            )}
            {activeTab === 'licensing' && (
              <>
                <FormField label="IATA Identifier" value={formData.iataNo} onChange={v => setFormData({...formData, iataNo: v})} editing={isEditing} />
                <FormField label="GDS Office ID" value={formData.officeId} onChange={v => setFormData({...formData, officeId: v})} editing={isEditing} />
                <FormField label="Tax Registration" value={formData.vatNo} onChange={v => setFormData({...formData, vatNo: v})} editing={isEditing} />
              </>
            )}
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}

function FormField({ label, value, onChange, type = 'text', editing }: { label: string; value: string | number; onChange: (val: string) => void; type?: string; editing: boolean; }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest ml-1">{label}</label>
      {editing ? (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-black/5 border-2 border-transparent focus:border-apple-blue rounded-xl px-6 py-4 text-sm font-bold outline-none transition-all" />
      ) : (
        <div className="w-full bg-black/[0.02] border-2 border-transparent rounded-xl px-6 py-4 text-sm font-bold text-black/60">
          {value || 'NULL'}
        </div>
      )}
    </div>
  );
}
